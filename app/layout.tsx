import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NoticeWise — Student workspace",
  description:
    "Check campus notices against your student profile with local, evidence-grounded eligibility matching.",
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
