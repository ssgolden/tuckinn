# Tuckinn Phase 3 — Customer Marketing & Experience

**Phase**: 3 - Customer Experience + Marketing  
**Goal**: Better retention + acquisition  
**Timeline**: 2-3 weeks  
**Planner**: Super Pi Swarm  
**Status**: Planning

---

## Overview

Transform one-time customers into loyal regulars through accounts, automation, and engagement. Build the foundation for sustainable growth.

---

## Dependency Graph

```
Week 1 — Foundation
  T1: Customer accounts API ──┬── T3: Account dashboard & login
  T2: JWT auth extension for customers ─┘
                                 │
                             T4: Order history API
                                 │
                             T5: Email service setup (SendGrid/AWS SES)
                                 │
Week 2 — Automation & Reviews
  T6: Abandoned cart recovery ───┬── T8: Marketing campaign tool (admin)
  T7: Post-order review request ─┘   T9: Review moderation (admin)
                                     │
                             T10: SEO meta tags + sitemap
                                 │
Week 3 — Polish & Launch
  T11: Birthday discounts/campaigns
  T12: Social sharing (OpenGraph)
  T13: Blog CMS foundation
  T14: E2E testing & launch
```

---

## Tasks

### Week 1: Foundation

#### T1: Customer Accounts API
- **depends_on**: []
- **location**: `platform/apps/api/src/auth/`
- **description**: Extend auth system for customer registration/login
- **scope**:
  - POST `/auth/customer/register`
  - POST `/auth/customer/login`
  - GET `/auth/customer/me`
  - PATCH `/auth/customer/profile`
  - Password reset flow
- **database**: Extend User model or create CustomerProfile
- **validation**: Test with Postman, customer can register + login
- **status**: Not Started
- **estimated**: 1.5 days

#### T2: JWT Auth Extension
- **depends_on**: []
- **location**: `platform/apps/api/src/auth/`
- **description**: Customer-specific JWT handling
- **scope**:
  - Role-based guards (`customer` vs `staff` vs `admin`)
  - Separate customer session (longer-lived?)
  - Optional auth for storefront (guest checkout still works)
- **validation**: Customer JWT works, doesn't conflict with staff
- **status**: Not Started
- **estimated**: 1 day

#### T3: Account Dashboard & Login (Storefront)
- **depends_on**: [T1, T2]
- **location**: `platform/apps/storefront/app/account/`
- **description**: Customer portal on storefront
- **scope**:
  - Login/Register modal or page
  - Account dashboard `/account`
  - Edit profile (name, phone, dietary prefs)
  - Saved addresses
  - Logout
- **components**: 
  - `LoginModal.tsx`
  - `AccountDashboard.tsx`
  - `ProfileForm.tsx`
- **validation**: Customer can register, login, view profile
- **status**: Not Started
- **estimated**: 2 days

#### T4: Order History API
- **depends_on**: [T1]
- **location**: `platform/apps/api/src/orders/`
- **description**: Customer-specific order query
- **scope**:
  - GET `/customers/me/orders` - paginated order history
  - GET `/customers/me/orders/:id` - order detail
  - Add customerId to orders (if not exists)
- **validation**: Returns only customer's orders
- **status**: Not Started
- **estimated**: 1 day

#### T5: Email Service Setup
- **depends_on**: []
- **location**: `platform/apps/api/src/notifications/`
- **description**: Transactional email infrastructure
- **decision**: 
  - **SendGrid** (easiest) or **AWS SES** (cheapest)
  - Template system (MJML for responsive)
- **scope**:
  - Email service abstraction
  - Send welcome email
  - Order confirmation email
  - Password reset email
- **env vars**: `SENDGRID_API_KEY`, `FROM_EMAIL`
- **validation**: Emails send, land in inbox (not spam)
- **status**: Not Started
- **estimated**: 1 day

---

### Week 2: Automation & Reviews

#### T6: Abandoned Cart Recovery
- **depends_on**: [T5]
- **location**: `platform/apps/api/src/carts/`, `platform/apps/api/src/campaigns/`
- **description**: Email customers who left items in cart
- **scope**:
  - Cron job: Check carts older than 1 hour with items
  - Send "Complete your order" email
  - Link with cart recovery token
  - Track conversion (did they complete?)
- **frequency**: Check every 15 mins
- **validation**: Test abandonment, email sends within 1 hour
- **status**: Not Started
- **estimated**: 2 days

#### T7: Post-Order Review Request
- **depends_on**: [T4, T5]
- **location**: `platform/apps/api/src/reviews/`
- **description**: Email asking for review after completion
- **scope**:
  - Cron: Orders completed 24 hours ago
  - Send review request email
  - Link to review form
  - Review endpoints: POST/GET reviews
- **database**: Review table (orderId, rating, comment, photos)
- **validation**: Review submits, shows on storefront
- **status**: Not Started
- **estimated**: 2 days

#### T8: Marketing Campaign Tool (Admin)
- **depends_on**: [T5]
- **location**: `platform/apps/admin/src/app/marketing/`
- **description**: Admin can send promotional blasts
- **scope**:
  - Segment customers (all, by location, by order count)
  - Create campaign (subject, body, template)
  - Schedule or send now
  - Track opens/clicks
- **templates**: 
  - Promotional
  - Flash sale
  - New product announcement
- **validation**: Admin can create campaign, customers receive email
- **status**: Not Started
- **estimated**: 2 days

#### T9: Review Moderation (Admin)
- **depends_on**: [T7]
- **location**: `platform/apps/admin/src/app/reviews/`
- **description**: Approve/reject customer reviews
- **scope**:
  - Reviews list (pending, approved, rejected)
  - Approve/reject actions
  - Star rating display
  - Bulk actions
- **validation**: Admin can moderate, approved reviews show on storefront
- **status**: Not Started
- **estimated**: 1 day

#### T10: SEO Meta Tags + Sitemap
- **depends_on**: []
- **location**: `platform/apps/storefront/app/`
- **description**: Search engine optimization
- **scope**:
  - Dynamic `<title>` and `<meta description>` per page
  - `/sitemap.xml` generation
  - `/robots.txt`
  - OpenGraph tags for social sharing
  - Structured data (JSON-LD) for products
- **validation**: Sitemap accessible, Facebook debugger shows OG data
- **status**: Not Started
- **estimated**: 1 day

---

### Week 3: Polish & Launch

#### T11: Birthday Discounts/Campaigns
- **depends_on**: [T8]
- **location**: `platform/apps/api/src/campaigns/`
- **description**: Automated birthday emails with discount
- **scope**:
  - Store customer birthday
  - Cron: Daily check for birthdays
  - Send birthday email with unique code
  - Promo code validation (birthday codes)
- **validation**: Birthday email sends, code works
- **status**: Not Started
- **estimated**: 1 day

#### T12: Social Sharing (OpenGraph)
- **depends_on**: [T10]
- **location**: `platform/apps/storefront/app/`
- **description**: Pretty links when sharing on social
- **scope**:
  - Product pages: image, title, price preview
  - Generate OG images dynamically (optional)
  - Share buttons on product pages
- **validation**: Facebook/Twitter card validator shows correct preview
- **status**: Not Started
- **estimated**: 0.5 day

#### T13: Blog CMS Foundation
- **depends_on**: []
- **location**: `platform/apps/admin/src/app/content/blog/`
- **description**: Basic blog for content marketing
- **scope**:
  - CRUD posts (title, slug, content, featured image, publish date)
  - Rich text editor (TipTap or similar)
  - Post list on storefront `/blog`
  - Individual post pages `/blog/:slug`
- **database**: Post table
- **validation**: Admin can write post, shows on storefront
- **status**: Not Started
- **estimated**: 2 days

#### T14: E2E Testing & Launch
- **depends_on**: [T1-T13]
- **description**: Full test suite + deployment
- **scope**:
  - Customer journey: register → order → review
  - Admin: campaign creation → email delivery
  - Mobile responsive testing
  - Load test email service
  - Documentation
- **deployment**: VPS deployment
- **validation**: All features work in production
- **status**: Not Started
- **estimated**: 1 day

---

## Parallel Execution Groups

| Wave | Tasks | Can Start | Duration |
|------|-------|-----------|----------|
| 1 | T1, T2, T5 | Immediately | 1.5 days |
| 2 | T3, T4 | T1+T2 complete | 2 days |
| 3 | T6, T7, T8, T10 | T4+T5 complete | 2 days |
| 4 | T9, T11, T12 | T7+T8 complete | 1.5 days |
| 5 | T13 | Parallel | 2 days |
| 6 | T14 | All complete | 1 day |

**Total Timeline**: ~10-12 working days (2-2.5 weeks)

---

## Technology Decisions

### Email Service
**Options**:
1. **SendGrid** - Easiest, good free tier (100 emails/day)
2. **AWS SES** - Cheapest at scale, more complex
3. **Mailgun** - Good deliverability

**Recommendation**: SendGrid for now ($0 to start, easy templates)

### Rich Text Editor (Blog)
**Options**:
1. **TipTap** - Modern, extensible, headless
2. **React-Quill** - Simple, battle-tested
3. **Slate.js** - Powerful, more complex

**Recommendation**: TipTap for blog editing

### Cron Jobs
**Options**:
1. **node-cron** - In-app scheduler (simple)
2. **BullMQ** - Redis-based queue (scalable)
3. **System cron** - Docker/host-based

**Recommendation**: BullMQ + Redis (you already have Redis running)

---

## Database Schema Additions

### Customer Extensions
```typescript
// User table already exists - needs role 'customer'
// Add to users or separate table:
interface CustomerProfile {
  userId: string;
  birthday?: Date;
  marketingConsent: boolean;
  dietaryPreferences?: string[]; // ['vegetarian', 'gluten-free']
  favoriteProductIds?: string[];
}
```

### Reviews
```typescript
interface Review {
  id: string;
  orderId: string;
  customerId: string;
  productId?: string; // optional: rate specific item
  rating: number; // 1-5
  comment?: string;
  photos?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}
```

### Marketing
```typescript
interface EmailCampaign {
  id: string;
  name: string;
  segment: 'all' | 'active' | 'inactive';
  subject: string;
  templateId: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: Date;
  sentAt?: Date;
  stats: { opens: number; clicks: number; };
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Emails land in spam | Use SendGrid, warm up domain, SPF/DKIM records |
| Customer adoption low | Make accounts optional, incentivize with loyalty points |
| Review spam | Require orders first, admin moderation |
| GDPR compliance | Consent checkboxes, data export/delete endpoints |
| Email costs scale | Can switch to SES later, monitor SendGrid limits |

---

## Success Metrics

| Metric | Baseline | Target (30 days post-launch) |
|--------|----------|------------------------------|
| Account registrations | 0 | >100 |
| Abandoned cart recovery | 0% | >10% conversion |
| Review rate | 0% | >5% of completed orders |
| Email open rate | N/A | >25% |
| Repeat purchase rate | Current | +20% |

---

## Next Steps

1. **Confirm email service choice** (SendGrid vs SES)
2. **Design email templates** (welcome, order, review request)
3. **Set up SendGrid account** (I'll need API key)
4. **Approve plan** and start T1 (Customer Accounts API)

**Ready to proceed?** Say "start phase 3" or ask questions about any task.
