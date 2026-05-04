/**
 * Admin password reset utility.
 *
 * Usage (from platform root):
 *   pnpm --filter @tuckinn/api admin:reset-password <email> [new-password]
 *
 * If [new-password] is omitted a strong random one is generated and printed.
 *
 * Notes:
 * - Requires DATABASE_URL in env (loaded automatically from .env / .env.production
 *   if present in the current working directory).
 * - Hash uses bcryptjs with cost 12 to match the AuthService.
 * - Active sessions for the target user are NOT revoked here; if you want
 *   immediate logout of stale sessions, also restart the API after running.
 */
import * as bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

const BCRYPT_COST = 12;

function generatePassword(byteLength = 16): string {
  // 16 random bytes → 22 base64 chars + 2 punctuation = strong + memorable.
  const raw = randomBytes(byteLength).toString("base64").replace(/[+/=]/g, "");
  return `${raw}!A`;
}

async function main() {
  const [email, providedPassword] = process.argv.slice(2);

  if (!email) {
    console.error("usage: reset-password <email> [new-password]");
    process.exit(2);
  }

  const newPassword = providedPassword?.trim() || generatePassword();
  const wasGenerated = !providedPassword;

  if (newPassword.length < 8) {
    console.error("error: password must be at least 8 characters");
    process.exit(2);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("error: DATABASE_URL is not set in the environment");
    process.exit(2);
  }
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error(`error: no user with email ${email}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    console.log(`✓ password updated for ${user.email}`);
    if (wasGenerated) {
      console.log("");
      console.log("Generated password (record it securely — not stored anywhere):");
      console.log(`  ${newPassword}`);
      console.log("");
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(err => {
  console.error("reset-password failed:", err);
  process.exit(1);
});
