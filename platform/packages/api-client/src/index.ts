export function createApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3200";
  return `${baseUrl}${path}`;
}
