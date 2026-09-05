import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import SWRegister from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "考研工作台",
  description: "全职考研 · 专注四科",
  appleWebApp: { capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="mx-auto w-full max-w-xl px-4 pt-4 pb-24 md:max-w-6xl md:px-6 md:pt-20 md:pb-10">{children}</main>
        <Nav />
        <SWRegister />
      </body>
    </html>
  );
}
