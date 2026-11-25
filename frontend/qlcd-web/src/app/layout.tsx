import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Hệ thống Công đoàn số - Bệnh viện TWQĐ 108",
  description: "Phần mềm Quản lý Công tác Công đoàn Bệnh viện Trung ương Quân đội 108",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return (
    <html lang="vi" className="h-full bg-background text-foreground">
      <body className="h-full font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
