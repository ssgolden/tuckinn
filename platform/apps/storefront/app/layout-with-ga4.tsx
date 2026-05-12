import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Bebas_Neue } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { CustomerAuthProvider } from "../lib/customer-auth";
import { StructuredData } from "../components/seo/StructuredData";
import { WhatsAppButton } from "../components/WhatsAppButton";
import Script from "next/script";

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

// SEO-Optimized Metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://tuckinnproper.com"),
  title: {
    template: "%s | TuckInn Proper",
    default: "Fresh Lunch, Fast Ordering | Order Food Online | TuckInn Proper"
  },
  description:
    "Order fresh lunch, meal deals, and custom sandwiches from TuckInn Proper. Quick online food ordering with local ingredients. Delivery and pickup available. Browse our menu and order today!",
  keywords: [
    "food ordering",
    "lunch delivery",
    "sandwiches",
    "meal deals",
    "order food online",
    "fresh lunch",
    "catering",
    "office lunch",
    "healthy food",
    "quick lunch"
  ],
  authors: [{ name: "TuckInn Proper" }],
  creator: "TuckInn Proper",
  publisher: "TuckInn Proper",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tuckinnproper.com",
    siteName: "TuckInn Proper",
    title: "Fresh Lunch, Fast Ordering | TuckInn Proper",
    description:
      "Order fresh lunch, meal deals, and custom sandwiches from TuckInn Proper. Quick online food ordering with local ingredients.",
    images: [
      {
        url: "https://tuckinnproper.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TuckInn Proper - Fresh Lunch, Fast Ordering"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresh Lunch, Fast Ordering | TuckInn Proper",
    description:
      "Order fresh lunch, meal deals, and custom sandwiches from TuckInn Proper. Quick online food ordering with local ingredients.",
    images: ["https://tuckinnproper.com/twitter-image.jpg"],
    creator: "@tuckinnproper"
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/logo.svg", type: "image/svg+xml" }
    ],
    shortcut: "/logo.svg"
  },
  manifest: "/manifest.json",
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
    other: {
      "bing": "YOUR_BING_VERIFICATION_CODE"
    }
  },
  alternates: {
    canonical: "https://tuckinnproper.com",
    languages: {
      "en-US": "https://tuckinnproper.com"
    }
  },
  category: "food"
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.tuckinnproper.com" />
        
        {/* Google Analytics 4 - Replace G-PLACEHOLDER with your actual Measurement ID */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PLACEHOLDER"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PLACEHOLDER', {
              page_title: document.title,
              page_location: window.location.href,
              send_page_view: true,
              transport_type: 'beacon'
            });
          `}
        </Script>
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
        <CustomerAuthProvider>
          <StructuredData />
          {children}
        </CustomerAuthProvider>
        <WhatsAppButton 
          phoneNumber="34627755609"
          message="Hi! I'd like to place an order from TuckInn Proper."
        />
      </body>
    </html>
  );
}
