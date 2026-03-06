import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <title>47daPunjab - Your Gateway to Punjab, Pakistan | Services, Shop & Community</title>
        <meta name="description" content="47daPunjab is your complete service platform for Punjab, Pakistan. Protocol services, customs assistance, marketplace, family search portal, blog, and community services for overseas Pakistanis." />
        <meta name="keywords" content="Punjab Pakistan, 47daPunjab, Pakistan services, customs assistance, protocol services, Punjab marketplace, overseas Pakistanis, family search, migration portal, Pakistan community" />
        <meta name="author" content="47daPunjab" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://47dapunjab.com/" />

        <meta name="theme-color" content="#0D7C3D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="47daPunjab" />
        <meta name="application-name" content="47daPunjab" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="47daPunjab" />
        <meta property="og:title" content="47daPunjab - Your Gateway to Punjab, Pakistan" />
        <meta property="og:description" content="Your complete service platform for Punjab, Pakistan. Protocol services, customs assistance, marketplace, family search, and community." />
        <meta property="og:url" content="https://47dapunjab.com/" />
        <meta property="og:image" content="https://47dapunjab.com/assets/images/icon.png" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:alt" content="47daPunjab - Your Gateway to Punjab" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="47daPunjab - Your Gateway to Punjab, Pakistan" />
        <meta name="twitter:description" content="Your complete service platform for Punjab, Pakistan. Protocol services, customs assistance, marketplace, family search, and community." />
        <meta name="twitter:image" content="https://47dapunjab.com/assets/images/icon.png" />

        <link rel="icon" type="image/png" href="/assets/images/favicon.png" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />
        <link rel="shortcut icon" type="image/png" href="/assets/images/favicon.png" />

        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "47daPunjab",
              "url": "https://47dapunjab.com",
              "logo": "https://47dapunjab.com/assets/images/icon.png",
              "description": "Your complete service platform for Punjab, Pakistan. Protocol services, customs assistance, marketplace, family search portal, and community.",
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "47dapunjab@gmail.com",
                "contactType": "customer service"
              },
              "sameAs": []
            }),
          }}
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
#root {
  display: flex;
  flex: 1;
}
`;
