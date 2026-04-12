export function createApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200/api";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
