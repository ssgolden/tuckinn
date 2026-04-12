import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700", "800"]
});

const displayFont = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-brand-display",
  weight: "400"
});

export const metadata: Metadata = {
  title: "Tuckinn Proper Staff | Live Orders Board",
  description:
    "Track live Tuckinn Proper orders, update fulfillment statuses, and monitor the realtime staff board.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
