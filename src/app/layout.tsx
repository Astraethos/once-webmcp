import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONCE — Shared Vendor Evaluation",
  description: "A shared human and agent workspace with a semantic collaboration trace. ONCE M2 vertical slice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
