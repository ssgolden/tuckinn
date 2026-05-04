import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { resolve } from "node:path";

const platformRoot = resolve(__dirname, "../../../../");

const DANGEROUS_DEFAULTS = [
  "replace-me",
  "replace-with-a-long-random-secret",
  "replace-with-strong-random-secret",
  "dev-secret",
  "tuckinn-dev-secret-change-in-production",
  "ChangeMe123!",
];

const REQUIRED_IN_PRODUCTION: Array<{
  key: string;
  label: string;
  warnOnly?: boolean;
}> = [
  { key: "JWT_ACCESS_SECRET", label: "JWT access token secret" },
  { key: "JWT_REFRESH_SECRET", label: "JWT refresh token secret" },
  { key: "SESSION_SECRET", label: "Session secret" },
  { key: "STRIPE_SECRET_KEY", label: "Stripe secret key", warnOnly: true },
  { key: "STORE_DOMAIN", label: "Storefront domain", warnOnly: true },
];

const REQUIRED_ALWAYS = new Set(["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(platformRoot, ".env.local"),
        resolve(platformRoot, ".env"),
        ".env.local",
        ".env"
      ]
    })
  ]
})
export class AppConfigModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const nodeEnv = this.configService.get<string>("NODE_ENV");
    const isProduction = nodeEnv === "production";
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const { key, label, warnOnly } of REQUIRED_IN_PRODUCTION) {
      const value = this.configService.get<string>(key);
      if (!value) {
        const msg = `Missing ${label} (${key}).`;
        if (warnOnly) warnings.push(msg); else errors.push(msg);
        continue;
      }

      if (DANGEROUS_DEFAULTS.some(d => value.includes(d))) {
        const msg = `${label} (${key}) uses a dangerous default value. Generate a real secret before deploying.`;
        if (warnOnly) warnings.push(msg); else errors.push(msg);
      }
    }

    const alwaysRequiredErrors: string[] = [];
    for (const { key, label } of REQUIRED_IN_PRODUCTION) {
      if (!REQUIRED_ALWAYS.has(key)) continue;
      const value = this.configService.get<string>(key);
      if (!value) {
        alwaysRequiredErrors.push(`Missing ${label} (${key}).`);
      } else if (DANGEROUS_DEFAULTS.some(d => value.includes(d))) {
        alwaysRequiredErrors.push(
          `${label} (${key}) uses a dangerous default value. Generate a real secret (e.g. \`openssl rand -hex 64\`).`
        );
      }
    }

    if (alwaysRequiredErrors.length > 0) {
      throw new Error(
        `Security check failed. JWT secrets must be set in every environment:\n${alwaysRequiredErrors.map(e => `  - ${e}`).join("\n")}`
      );
    }

    if (isProduction && errors.length > 0) {
      throw new Error(
        `Security check failed. Fix these before the app can start:\n${errors.map(e => `  - ${e}`).join("\n")}`
      );
    }

    const all = [...errors, ...warnings];
    if (all.length > 0) {
      console.warn(
        `⚠️  Security warning (non-blocking in ${isProduction ? 'production' : 'development'}):\n${all.map(e => `  - ${e}`).join("\n")}`
      );
    }
  }
}
