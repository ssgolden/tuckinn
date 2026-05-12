// SEO Utility functions

interface SEOMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export function generateSEOMeta({
  title,
  description,
  keywords = [],
  ogImage,
  canonical,
  noIndex = false
}: SEOMeta) {
  return {
    title: `${title} | TuckInn Proper`,
    description: description,
    keywords: keywords.join(", "),
    openGraph: {
      title: title,
      description: description,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630 }]
        : [{ url: "https://tuckinnproper.com/og-image.jpg", width: 1200, height: 630 }]
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ogImage ? [ogImage] : ["https://tuckinnproper.com/twitter-image.jpg"]
    },
    alternates: canonical
      ? { canonical: canonical }
      : undefined,
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true }
  };
}

// Breadcrumb schema generator
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// FAQ Schema generator for FAQ pages
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

// Menu item schema generator
export function generateMenuItemSchema(item: {
  name: string;
  description: string;
  price: string;
  image?: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: item.name,
    description: item.description,
    image: item.image,
    offers: {
      "@type": "Offer",
      price: item.price,
      priceCurrency: "USD"
    },
    suitableForDiet: "https://schema.org/GlutenFreeDiet"
  };
}

// Review/Rating schema generator
export function generateReviewSchema(review: {
  rating: number;
  reviewCount: number;
  itemReviewed?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: review.rating.toString(),
    reviewCount: review.reviewCount,
    bestRating: "5",
    worstRating: "1",
    itemReviewed: review.itemReviewed
      ? {
          "@type": "Restaurant",
          name: review.itemReviewed
        }
      : undefined
  };
}
