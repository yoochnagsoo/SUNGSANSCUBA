import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import VisitorLogger from "@/components/visitor/VisitorLogger";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SUNG SAN SCUBA",
  description: "제주 성산 스쿠버다이빙 예약 및 다이빙 센터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <VisitorLogger />
        {children}
      </body>
    </html>
  );
}