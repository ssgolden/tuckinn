-- AlterTable: Add business settings to locations
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "opening_hours" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "tax_rate" DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "delivery_fee" DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "minimum_delivery_order" DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "ordering_cutoff_minutes" INTEGER DEFAULT 0;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "is_online_ordering_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "delivery_radius_km" INTEGER;

-- CreateTable: Password resets
CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_resets_token_key" ON "password_resets"("token");
CREATE INDEX IF NOT EXISTS "password_resets_token_idx" ON "password_resets"("token");
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;