import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Bebas_Neue } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800", "900"]
});

const displayFont = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-brand-display",
  weight: "400"
});

export const metadata: Metadata = {
  title: "Tuckinn Proper | Fresh Lunch, Fast Ordering",
  description:
    "Order Tuckinn Proper favourites, meal deals, and custom sandwiches through a warmer, clearer branded storefront.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg"
  }
};

export const viewport: Viewport = {
  themeColor: "#050505"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}