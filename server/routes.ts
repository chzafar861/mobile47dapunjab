import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { addDocument, getDocuments, deleteDocument, setDocument, getDocument } from "./firebase";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const docRef = await addDocument("bookings", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e: any) {
      console.error("Error adding booking:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bookings", async (_req: Request, res: Response) => {
    try {
      const items = await getDocuments("bookings");
      res.json(items);
    } catch (e: any) {
      console.error("Error getting bookings:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      await deleteDocument("bookings", req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error deleting booking:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/cart", async (req: Request, res: Response) => {
    try {
      const docRef = await addDocument("cart", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/cart", async (_req: Request, res: Response) => {
    try {
      const items = await getDocuments("cart");
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      await deleteDocument("cart", req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rental-inquiries", async (req: Request, res: Response) => {
    try {
      const docRef = await addDocument("rentalInquiries", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/property-details", async (req: Request, res: Response) => {
    try {
      const docRef = await addDocument("propertyDetails", req.body);
      res.json({ docId: docRef.id, ...req.body });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/property-details", async (_req: Request, res: Response) => {
    try {
      const items = await getDocuments("propertyDetails");
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/property-details/:id", async (req: Request, res: Response) => {
    try {
      await deleteDocument("propertyDetails", req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/profile", async (_req: Request, res: Response) => {
    try {
      const data = await getDocument("users", "defaultUser");
      if (data) {
        res.json(data);
      } else {
        res.json({ name: "", phone: "", email: "", city: "", country: "", purpose: "" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/profile", async (req: Request, res: Response) => {
    try {
      await setDocument("users", "defaultUser", req.body);
      res.json(req.body);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/clear-all", async (_req: Request, res: Response) => {
    try {
      await setDocument("users", "defaultUser", { name: "", phone: "", email: "", city: "", country: "", purpose: "" });
      const bookings = await getDocuments("bookings");
      for (const b of bookings) {
        await deleteDocument("bookings", b.docId);
      }
      const cartItems = await getDocuments("cart");
      for (const c of cartItems) {
        await deleteDocument("cart", c.docId);
      }
      const props = await getDocuments("propertyDetails");
      for (const p of props) {
        await deleteDocument("propertyDetails", p.docId);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
