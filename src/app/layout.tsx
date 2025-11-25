import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "SmartEats - UIUC Dining Nutrition",
  description:
    "Get detailed nutritional information for UIUC dining hall menus. Track your macros, plan meals, and eat smarter.",
  keywords: [
    "UIUC",
    "dining",
    "nutrition",
    "calories",
    "macros",
    "meal planning",
    "university dining",
  ],
  authors: [{ name: "SmartEats" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
