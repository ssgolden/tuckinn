-- AlterTable
-- This migration adds the `name` column that was manually created on the VPS.
-- On a fresh database, this is a no-op with the IF NOT EXISTS guard.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dining_tables'
      AND column_name = 'name'
  ) THEN
    ALTER TABLE "dining_tables" ADD COLUMN "name" TEXT;
  END IF;
END $$;