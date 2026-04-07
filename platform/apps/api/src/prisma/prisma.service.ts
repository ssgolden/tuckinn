import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { PrismaClient } from "../../src/generated/prisma/index.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    loadEnvironmentFiles();
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }

    const pool = new Pool({
      connectionString
    });

    super({
      adapter: new PrismaPg(pool)
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}

function loadEnvironmentFiles() {
  const envCandidates = [
    resolve(__dirname, "../../../../.env.local"),
    resolve(__dirname, "../../../../.env")
  ];

  for (const envPath of envCandidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    const envContents = readFileSync(envPath, "utf8");
    for (const line of envContents.split(/\r?\n/)) {
      const match = line.match(/^(?!#)([^=]+)=(.*)$/);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      if (!process.env[key]) {
        process.env[key] = rawValue;
      }
    }
  }
}
