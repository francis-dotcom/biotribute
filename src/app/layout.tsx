import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "bioTributes",
  description: "Honor Their Life. Share Their Legacy."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <link key="preconnect-turnstile" rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="" />
        ) : null}
      </head>
      <body>
        {children}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="beforeInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
