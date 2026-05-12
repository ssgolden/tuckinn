# Phase 3 — Full Parallel Execution Plan

**Mode**: Full Steam (All Remaining Tasks)  
**Strategy**: 3 Waves of Parallel Execution  
**Date**: 2026-04-14

---

## Wave 1 — Foundation UI & APIs (START NOW)

These tasks have no dependencies on each other - run in parallel.

### Task T3: Storefront Customer UI
**Agent**: storefront-ui-dev  
**Scope**: 
- Login/Register modal components
- Account dashboard page `/account`
- Order history view
- Profile edit form
- Protected route wrapper

**Files**:
- `apps/storefront/app/account/page.tsx`
- `apps/storefront/app/account/login-modal.tsx`
- `apps/storefront/lib/customer-auth.ts`

**Acceptance**:
- Customer can register, login, view orders
- Session persists across page reloads
- Mobile responsive

---

### Task T6: Abandoned Cart Recovery
**Agent**: backend-automation-dev  
**Scope**:
- Cron job service (BullMQ + Redis)
- Check carts abandoned >1 hour
- Send email via EmailService
- Cart recovery token/link
- Track conversions

**Files**:
- `apps/api/src/carts/cart-recovery.service.ts`
- `apps/api/src/carts/cart-recovery.processor.ts`
- New queue configuration

**Acceptance**:
- Cron runs every 15 mins
- Email sends for abandoned carts
- Link restores cart on storefront

---

### Task T7: Review System API
**Agent**: backend-api-dev  
**Scope**:
- Review Prisma schema additions
- POST /reviews endpoint
- GET /reviews (public, by product)
- GET /reviews/me (customer's reviews)
- Photo upload support

**Files**:
- Update schema.prisma
- `apps/api/src/reviews/reviews.controller.ts`
- `apps/api/src/reviews/reviews.service.ts`

**Acceptance**:
- Customer can submit review
- Reviews visible on storefront
- Photos uploadable

---

### Task T10: SEO & Meta Tags
**Agent**: frontend-seo-dev  
**Scope**:
- Dynamic title/description per page
- OpenGraph tags
- `/sitemap.xml` route
- `/robots.txt`
- JSON-LD structured data

**Files**:
- `apps/storefront/app/sitemap.xml/route.ts`
- `apps/storefront/app/robots.ts`
- Update layout metadata
- Product page JSON-LD

**Acceptance**:
- Facebook debugger shows correct OG data
- Sitemap accessible
- Product rich snippets in Google

---

### Task T13: Blog CMS Foundation
**Agent**: backend-frontend-dev  
**Scope**:
- Post schema + CRUD API
- Admin blog editor (TipTap)
- Storefront blog list/post pages
- Slug-based routing

**Files**:
- Schema: Post table
- `apps/api/src/blog/blog.controller.ts`
- `apps/admin/src/app/content/blog/*`
- `apps/storefront/app/blog/*`

**Acceptance**:
- Admin can write, publish posts
- Posts visible on storefront
- SEO-friendly URLs

---

## Wave 2 — Automation & Admin Tools

(Start after Wave 1 tasks complete)

### Task T8: Marketing Campaign Tool
**Depends**: T6 (email), T13 (content)  
**Scope**:
- Campaign CRUD in admin
- Customer segmentation
- Email template selection
- Schedule/send campaign
- Track opens/clicks

---

### Task T9: Review Moderation
**Depends**: T7 (reviews)  
**Scope**:
- Admin reviews list
- Approve/reject actions
- Star rating display
- Bulk moderation

---

### Task T11: Birthday Campaigns
**Depends**: T8 (campaigns)  
**Scope**:
- Store birthday in profile
- Daily cron for birthdays
- Auto-send discount code
- Unique promo code generation

---

### Task T12: Social Sharing
**Depends**: T10 (SEO)  
**Scope**:
- OG image generation (optional)
- Share buttons on products
- Pre-written share text

---

## Wave 3 — Integration & Launch

### Task T14: E2E Testing & Deployment
**Depends**: ALL  
**Scope**:
- Full customer journey test
- Email delivery verification
- Load testing
- Documentation
- VPS deployment
- Monitoring setup

---

## Parallel Execution Commands

```bash
# Wave 1 - Start all 5 tasks in parallel
/parallel-task PHASE-3-PARALLEL-EXECUTION.md T3 T6 T7 T10 T13

# After Wave 1 complete, start Wave 2
/parallel-task PHASE-3-PARALLEL-EXECUTION.md T8 T9 T11 T12

# Final integration
/parallel-task PHASE-3-PARALLEL-EXECUTION.md T14
```

---

## Database Migrations Needed

1. **Reviews Table**
2. **Blog Posts Table**  
3. **Campaigns Table**
4. **Customer Birthday Field** (profile)

Run after each wave's API changes:
```bash
cd platform && pnpm prisma:migrate:dev
```
