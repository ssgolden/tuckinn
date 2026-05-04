import type { ConfigService } from "@nestjs/config";

const DANGEROUS_DEFAULTS = new Set([
  "replace-me",
  "replace-with-a-long-random-secret",
  "dev-secret",
  "tuckinn-dev-secret-change-in-production",
  "ChangeMe123!"
]);

type JwtSecretKind = "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET";

export function getJwtSecret(configService: ConfigService, kind: JwtSecretKind): string {
  const value = configService.get<string>(kind);
  if (!value) {
    throw new Error(`${kind} is not configured. Set it in your environment before starting the API.`);
  }
  if (DANGEROUS_DEFAULTS.has(value)) {
    throw new Error(`${kind} is set to a known dangerous default ("${value}"). Generate a real secret (e.g. \`openssl rand -hex 64\`).`);
  }
  return value;
}
