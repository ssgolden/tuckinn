-- Add Review table
CREATE TABLE "reviews" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "customer_user_id" UUID,
    "product_id" UUID,
    "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" TEXT,
    "photos" JSON DEFAULT '[]',
    "status" VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    "is_featured" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
    FOREIGN KEY ("customer_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
);

CREATE INDEX idx_reviews_order ON "reviews"("order_id");
CREATE INDEX idx_reviews_customer ON "reviews"("customer_user_id");
CREATE INDEX idx_reviews_product ON "reviews"("product_id");
CREATE INDEX idx_reviews_status ON "reviews"("status");

-- Add Blog Post table
CREATE TABLE "posts" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" VARCHAR UNIQUE NOT NULL,
    "title" VARCHAR NOT NULL,
    "excerpt" VARCHAR(500),
    "content" TEXT NOT NULL,
    "featured_image_url" VARCHAR,
    "author_id" UUID NOT NULL,
    "status" VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    "published_at" TIMESTAMPTZ,
    "seo_title" VARCHAR,
    "seo_description" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX idx_posts_slug ON "posts"("slug");
CREATE INDEX idx_posts_status ON "posts"("status");
CREATE INDEX idx_posts_published ON "posts"("published_at");

-- Add birthday to customer profile
ALTER TABLE "customer_profiles" ADD COLUMN "birthday" DATE;

-- Add email campaign tracking
CREATE TABLE "email_campaigns" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "subject" VARCHAR NOT NULL,
    "segment" VARCHAR(20) DEFAULT 'all' CHECK (segment IN ('all', 'active', 'inactive')),
    "template_id" VARCHAR,
    "status" VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
    "scheduled_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "stats" JSON DEFAULT '{"opens": 0, "clicks": 0}',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;