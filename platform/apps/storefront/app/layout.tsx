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
  metadataBase: new URL("https://tuckinnproper.com"),
  title: "Tuckinn Proper | Fresh Lunch, Fast Ordering",
  description:
    "Order Tuckinn Proper favourites, meal deals, and custom sandwiches through a warmer, clearer branded storefront.",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg"
  },
  openGraph: {
    type: "website",
    siteName: "Tuckinn Proper",
    title: "Tuckinn Proper | Fresh Lunch, Fast Ordering",
    description:
      "Order Tuckinn Proper favourites, meal deals, and custom sandwiches through a warmer, clearer branded storefront.",
    url: "https://tuckinnproper.com",
    locale: "en_GB",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Tuckinn Proper"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuckinn Proper | Fresh Lunch, Fast Ordering",
    description:
      "Order Tuckinn Proper favourites, meal deals, and custom sandwiches through a warmer, clearer branded storefront.",
    images: ["/logo.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Tuckinn Proper",
  "url": "https://tuckinnproper.com",
  "image": "https://tuckinnproper.com/logo.jpg",
  "description": "Fresh, fast lunch ordering — meal deals and custom sandwiches.",
  "servesCuisine": ["Sandwiches", "Lunch"],
  "priceRange": "££",
  "acceptsReservations": false
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }} />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
