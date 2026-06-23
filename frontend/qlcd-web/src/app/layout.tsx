import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hệ thống Công đoàn số - Bệnh viện TWQĐ 108",
  description: "Phần mềm Quản lý Công tác Công đoàn Bệnh viện Trung ương Quân đội 108",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full bg-slate-50 text-slate-900">
      <body className={`${inter.className} h-full`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
