import express from "express";
import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import compression from "compression";
import { registerRoutes } from "./routes";
import authRouter, { tokenAuthMiddleware, ensureAuthTokensTable } from "./auth";
import * as fs from "fs";
import * as path from "path";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCompression(app: express.Application) {
  app.use(compression());
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    origins.add("https://47dapunjab.com");
    origins.add("https://www.47dapunjab.com");

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    const isMobileApp = !origin && req.header("Authorization")?.startsWith("Bearer ");

    if (isMobileApp) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    } else if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      limit: "50mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false, limit: "50mb" }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const safeResponse = { ...capturedJsonResponse };
        delete safeResponse.token;
        delete safeResponse.password_hash;
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

const METRO_PROXY_SKIP_HEADERS = new Set(["transfer-encoding", "content-length", "connection", "content-encoding"]);

function getPublicHost(req: Request): string {
  return req.header("x-forwarded-host") || req.get("host") || "";
}

async function proxyManifestFromMetro(platform: string, req: Request, res: Response) {
  const metroUrl = "http://localhost:8081";
  try {
    const response = await fetch(`${metroUrl}/manifest`, {
      headers: { "expo-platform": platform },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Metro returned ${response.status} for ${platform} manifest` });
    }

    const host = getPublicHost(req);
    const publicBaseUrl = `https://${host}`;

    response.headers.forEach((value, key) => {
      if (!METRO_PROXY_SKIP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    let body = await response.text();
    body = body.replace(/https?:\/\/[^"'\s]*?:8081/g, publicBaseUrl);
    body = body.replace(/exp:\/\/[^"'\s]*?:8081/g, `exp://${host}`);
    body = body.replace(/localhost:8081/g, host);

    res.send(body);
  } catch (error) {
    log(`Metro proxy failed for ${platform} manifest:`, error);
    return res
      .status(502)
      .json({ error: `Could not connect to Metro bundler at ${metroUrl}. Is the frontend running?` });
  }
}

async function proxyToMetro(req: Request, res: Response) {
  const metroUrl = `http://localhost:8081${req.originalUrl}`;
  try {
    const headers: Record<string, string> = {};
    const forwardHeaders = ["expo-platform", "accept", "user-agent", "range"];
    for (const h of forwardHeaders) {
      const val = req.header(h);
      if (val) headers[h] = val;
    }

    const response = await fetch(metroUrl, { headers });

    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }

    response.headers.forEach((value, key) => {
      if (!METRO_PROXY_SKIP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(502).json({ error: "Could not connect to Metro bundler" });
  }
}

function serveExpoManifest(platform: string, req: Request, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    if (process.env.NODE_ENV === "development") {
      return proxyManifestFromMetro(platform, req, res);
    }
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  if (process.env.NODE_ENV === "development") {
    app.get("/status", (_req: Request, res: Response) => {
      res.send("packager-status:running");
    });
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, req, res);
    }

    if (req.path === "/") {
      if (process.env.NODE_ENV === "development") {
        return proxyToMetro(req, res);
      }

      const webBuildIndex = path.resolve(process.cwd(), "web-build", "index.html");
      if (fs.existsSync(webBuildIndex)) {
        return res.sendFile(webBuildIndex);
      }

      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    next();
  });

  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /my-orders\nDisallow: /my-submissions\nDisallow: /profile\n\nSitemap: https://47dapunjab.com/sitemap.xml`
    );
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    const pages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/services", priority: "0.9", changefreq: "weekly" },
      { loc: "/shop", priority: "0.9", changefreq: "weekly" },
      { loc: "/rent", priority: "0.8", changefreq: "weekly" },
      { loc: "/blog", priority: "0.8", changefreq: "daily" },
      { loc: "/history", priority: "0.7", changefreq: "monthly" },
      { loc: "/pakistan-guide", priority: "0.7", changefreq: "monthly" },
      { loc: "/login", priority: "0.5", changefreq: "monthly" },
      { loc: "/subscription", priority: "0.6", changefreq: "monthly" },
      { loc: "/submit-details", priority: "0.6", changefreq: "monthly" },
      { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    ];
    const urls = pages.map(p => `  <url>\n    <loc>https://47dapunjab.com${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`).join("\n");
    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
    );
  });

  app.get("/site.webmanifest", (_req: Request, res: Response) => {
    res.type("application/manifest+json").json({
      name: "47daPunjab",
      short_name: "47daPunjab",
      description: "Your complete service platform for Punjab, Pakistan",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0D7C3D",
      icons: [
        { src: "/assets/images/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/assets/images/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/assets/images/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
      ]
    });
  });

  const staticCacheOptions = { maxAge: "7d", etag: true };
  app.use("/assets", express.static(path.resolve(process.cwd(), "assets"), staticCacheOptions));
  app.use(express.static(path.resolve(process.cwd(), "static-build"), staticCacheOptions));

  if (process.env.NODE_ENV !== "development") {
    const webBuildDir = path.resolve(process.cwd(), "web-build");
    if (fs.existsSync(webBuildDir)) {
      app.use(express.static(webBuildDir, staticCacheOptions));
    }
  }

  if (process.env.NODE_ENV === "development") {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      return proxyToMetro(req, res);
    });
    log("Dev mode: Full Metro proxy enabled for web and bundle requests");
  } else {
    const webBuildIndex = path.resolve(process.cwd(), "web-build", "index.html");
    if (fs.existsSync(webBuildIndex)) {
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/assets") || req.method !== "GET") {
          return next();
        }
        const ext = path.extname(req.path);
        if (ext && ext !== ".html") {
          return next();
        }
        res.sendFile(webBuildIndex);
      });
      log("Production: Serving Expo web build with SPA fallback");
    }
  }

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });
}

(async () => {
  app.set("trust proxy", 1);
  setupCompression(app);
  setupCors(app);
  setupBodyParsing(app);

  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "47dapunjab-secret-key",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  app.use(tokenAuthMiddleware());
  setupRequestLogging(app);
  configureExpoAndLanding(app);

  await ensureAuthTokensTable();
  app.use(authRouter);
  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`express server serving on port ${port}`);
    },
  );
})();
