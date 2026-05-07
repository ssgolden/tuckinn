import type { MetadataRoute } from "next";

const baseUrl = "https://tuckinnproper.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${baseUrl}/review`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7
    }
  ];
}
