import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fashion · Agentic Commerce Demo",
  description:
    "Explore how product-page evidence supports a shopper recommendation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
