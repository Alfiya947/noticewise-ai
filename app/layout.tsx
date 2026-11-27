import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NoticeWise — Your Personal AI Opportunity Navigator",
  description:
    "Analyze campus notices, posters, PDFs, and public opportunity pages with evidence-grounded AI extraction and local eligibility matching.",
};
export const viewport: Viewport = {
  themeColor: "#faf9f6",
  colorScheme: "light",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body>{children}</body>
    </html>
  );
}
