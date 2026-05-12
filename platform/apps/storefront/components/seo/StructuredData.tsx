"use client";

import Script from "next/script";

// LocalBusiness + Restaurant Schema
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://tuckinnproper.com",
  "name": "TuckInn Proper",
  "alternateName": "TuckInn",
  "url": "https://tuckinnproper.com",
  "logo": "https://tuckinnproper.com/logo.svg",
  "image": [
    "https://tuckinnproper.com/logo.svg",
    "https://tuckinnproper.com/og-image.jpg",
    "https://tuckinnproper.com/storefront.jpg"
  ],
  "description": "Fresh lunch, meal deals, and custom sandwiches. Quick online food ordering with local ingredients. Delivery and pickup available.",
  "servesCuisine": ["Sandwiches", "Lunch", "Healthy Food", "American"],
  "priceRange": "$$",
  "currenciesAccepted": "USD",
  "paymentAccepted": "Cash, Credit Card, Debit Card",
  "openingHours": [
    "Mo-Fr 08:00-18:00",
    "Sa 09:00-16:00",
    "Su 10:00-14:00"
  ],
  "telephone": "+1-XXX-XXX-XXXX",
  "email": "info@tuckinnproper.com",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Menu",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Delivery"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Pickup"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Catering"
          }
        }
      }
    ]
  },
  "potentialAction": [
    {
      "@type": "OrderAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://tuckinnproper.com/order",
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      },
      "result": {
        "@type": "ReserveAction",
        "name": "Order Online"
      }
    },
    {
      "@type": "ReserveAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://tuckinnproper.com/reserve"
      },
      "result": {
        "@type": "FoodEstablishmentReservation",
        "name": "Table Reservation"
      }
    }
  ],
  "sameAs": [
    "https://www.facebook.com/tuckinnproper",
    "https://www.instagram.com/tuckinnproper",
    "https://twitter.com/tuckinnproper",
    "https://www.yelp.com/biz/tuckinnproper"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "124",
    "bestRating": "5",
    "worstRating": "1"
  }
};

// WebSite Schema
const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://tuckinnproper.com/#website",
  "url": "https://tuckinnproper.com",
  "name": "TuckInn Proper",
  "alternateName": "TuckInn",
  "description": "Fresh Lunch, Fast Ordering. Order meal deals, sandwiches, and healthy lunch online.",
  "publisher": {
    "@id": "https://tuckinnproper.com"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://tuckinnproper.com/menu?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": "en-US"
};

// BreadcrumbList Schema (for homepage)
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://tuckinnproper.com"
    }
  ]
};

// Organization Schema
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://tuckinnproper.com/#organization",
  "name": "TuckInn Proper",
  "alternateName": "TuckInn",
  "url": "https://tuckinnproper.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://tuckinnproper.com/logo.svg",
    "caption": "TuckInn Proper Logo"
  },
  "image": "https://tuckinnproper.com/og-image.jpg",
  "foundingDate": "2024",
  "founders": [
    {
      "@type": "Person",
      "name": "TuckInn Team"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/tuckinnproper",
    "https://www.instagram.com/tuckinnproper",
    "https://twitter.com/tuckinnproper",
    "https://www.linkedin.com/company/tuckinnproper"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-XXX-XXX-XXXX",
    "contactType": "customer service",
    "availableLanguage": ["English"],
    "areaServed": "US"
  }
};

export function StructuredData() {
  const schemas = [localBusinessSchema, webSiteSchema, breadcrumbSchema, organizationSchema];

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemas)
      }}
    />
  );
}
