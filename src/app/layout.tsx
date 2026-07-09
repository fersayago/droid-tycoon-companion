import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Droid Tycoon Companion",
  description: "Local Droidex and rebirth tracker for Fortnite Droid Tycoon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
