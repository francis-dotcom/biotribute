import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
