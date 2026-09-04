import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONCE — Teach an agent by working with it once",
  description: "Turn one human-agent collaboration into a reusable semantic routine with new inputs and learned human approval boundaries.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
