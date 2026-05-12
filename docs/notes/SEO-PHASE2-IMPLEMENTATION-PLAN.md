# SEO Phase 2 Implementation Plan
**Goal:** Complete content marketing, local SEO, performance optimization, and link building  
**Domain:** tuckinnproper.com  
**Date:** 2026-04-17  
**Estimated Duration:** 3-4 hours

## Architecture
This phase implements content marketing infrastructure, Google Business Profile integration, Core Web Vitals optimization, and strategic link building. All components work together to boost search rankings after the technical foundation established in Phase 1.

## Tech Stack
- **Framework:** Next.js 15 + React 19
- **CMS:** Custom blog (Markdown/MDX)
- **SEO:** Schema.org JSON-LD, Open Graph
- **Performance:** Next.js Image optimization, code splitting
- **Analytics:** Google Analytics 4 + Search Console

---

## Task Decomposition

### Wave 1: Content Infrastructure (Independent)
- [ ] Task 1.1: Create /blog directory structure
- [ ] Task 1.2: Create MDX blog posts (4 posts pre-written)
- [ ] Task 1.3: Implement blog listing page
- [ ] Task 1.4: Implement individual blog post pages
- [ ] Task 1.5: Add blog to sitemap
- [ ] Task 1.6: Create Open Graph images

### Wave 2: Google Business Profile (Independent)
- [ ] Task 2.1: Create Google Business Profile optimization guide
- [ ] Task 2.2: Add GBP widget/schema to site
- [ ] Task 2.3: Create review generation automation
- [ ] Task 2.4: Add local citations list

### Wave 3: Performance Optimization (Depends on Wave 1)
- [ ] Task 3.1: Run Core Web Vitals audit
- [ ] Task 3.2: Optimize LCP (Largest Contentful Paint)
- [ ] Task 3.3: Optimize CLS (Cumulative Layout Shift)
- [ ] Task 3.4: Implement font loading optimization
- [ ] Task 3.5: Add image optimization + WebP

### Wave 4: Social Media & Sharing (Depends on Wave 1)
- [ ] Task 4.1: Generate Open Graph images
- [ ] Task 4.2: Create social sharing buttons
- [ ] Task 4.3: Add social profile links

### Wave 5: Link Building (Independent)
- [ ] Task 5.1: Create local business directory list
- [ ] Task 5.2: Generate guest post outreach templates
- [ ] Task 5.3: Create link magnet content (free resources)

### Wave 6: Deployment (Depends on Waves 1-5)
- [ ] Task 6.1: Build and test all changes
- [ ] Task 6.2: Rebuild storefront Docker image
- [ ] Task 6.3: Deploy to VPS
- [ ] Task 6.4: Verify SEO score improvement
- [ ] Task 6.5: Submit updated sitemap to Google

---

## Task Details

### Task 1.1: Create /blog Directory Structure

**Files to Create:**
```
platform/apps/storefront/app/blog/
├── page.tsx                    # Blog listing page
├── [slug]/
│   └── page.tsx               # Individual blog post
├── layout.tsx                 # Blog section layout
└── posts/
    ├── healthy-lunch-ideas.md
    ├── signature-sandwiches.md
    ├── office-catering-guide.md
    └── meal-prep-vs-fresh.md
```

**Acceptance Criteria:**
- Blog directory exists with proper Next.js App Router structure
- Posts are stored in /posts/ as .md files
- Layout includes breadcrumb navigation

### Task 1.2: Create MDX Blog Posts

**Create 4 SEO-optimized blog posts:**

**Post 1:** "10 Healthy Lunch Ideas for Busy Professionals"
- Target keyword: "healthy lunch ideas"
- Word count: 1,200-1,500 words
- Include: H1, H2s, bullet lists, images

**Post 2:** "The Ultimate Guide to Our Signature Sandwiches"  
- Target keyword: "best sandwiches [location]"
- Word count: 1,000-1,300 words
- Include: Internal links to menu

**Post 3:** "Office Catering 101: How to Order Lunch for Your Team"
- Target keyword: "office catering"
- Word count: 1,100-1,400 words
- Include: CTA to contact/catering page

**Post 4:** "Fresh vs Meal Prep: What You Need to Know"
- Target keyword: "fresh meal delivery"
- Word count: 900-1,200 words
- Include: Comparison chart, pros/cons

### Task 1.3: Implement Blog Listing Page

**File:** `app/blog/page.tsx`

**Requirements:**
- Display all blog posts with excerpt
- Pagination (6 posts per page)
- Category filtering
- Meta: "Blog | TuckInn Proper"
- Schema: BlogPosting

### Task 1.4: Implement Individual Blog Post Page

**File:** `app/blog/[slug]/page.tsx`

**Requirements:**
- Render MDX content
- Author bio section
- Related posts
- Social sharing buttons
- Reading time estimate
- Schema: BlogPosting with Article

### Task 2.1-2.4: Google Business Profile

Create comprehensive GBP optimization document and scripts:
- Add LocalBusiness schema enhancements
- Include opening hours, services
- Create review generation email template

### Task 3.1-3.5: Core Web Vitals

**Metrics to Achieve:**
- **LCP:** < 2.5s (currently needs work)
- **FID:** < 100ms  
- **CLS:** < 0.1
- **FCP:** < 1.8s

**Optimizations:**
- Image WebP conversion
- Font display: swap
- Lazy loading below-fold
- Critical CSS extraction
- Preload critical resources

### Task 4.1-4.3: Social Media

- Generate Open Graph images (1200x630)
- Add share buttons to blog posts
- Create social media profile links

### Task 5.1-5.3: Link Building

- List of 50 local directories
- Email templates for outreach
- Create downloadable resource (PDF)

---

## File Modifications

### Current Files (Modify)

1. **app/layout.tsx**
   - Add Google Analytics script
   - Add Hotjar/heatmap script (optional)

2. **components/seo/StructuredData.tsx**
   - Enhance LocalBusiness schema with reviews
   - Add BlogPosting schema support

3. **next.config.js** (if exists)
   - Add image optimization settings
   - Enable compression

### New Files (Create)

**Content (8 files):**
- app/blog/page.tsx
- app/blog/[slug]/page.tsx  
- app/blog/layout.tsx
- app/blog/posts/*.md (4 files)

**Components (3 files):**
- components/blog/BlogCard.tsx
- components/blog/BlogPost.tsx
- components/blog/ShareButtons.tsx

**Utilities (2 files):**
- lib/mdx.ts (MDX rendering)
- lib/posts.ts (post fetching)

**Assets (5 files):**
- public/og-image.jpg (1200x630)
- public/twitter-image.jpg (1200x630)
- public/blog/featured-1.jpg
- public/blog/featured-2.jpg
- public/blog/featured-3.jpg

**Documentation (3 files):**
- docs/gbp-optimization.md
- docs/link-building-guide.md
- docs/content-calendar.md

---

## Testing Strategy

### Unit Tests
- Blog post rendering
- SEO component output
- MDX parsing

### Integration Tests
- Blog navigation flow
- Meta tag generation
- Sitemap generation with blog posts

### SEO Audits
- Lighthouse score (target: 90+)
- Schema validation (Google Rich Results Test)
- Mobile-friendliness (Google Mobile-Friendly Test)
- Core Web Vitals (PageSpeed Insights)

---

## Acceptance Criteria (Phase 2)

1. **Content Marketing:**
   - [ ] 4 blog posts published
   - [ ] Blog section accessible at /blog
   - [ ] Updated sitemap with blog posts

2. **Local SEO:**
   - [ ] Enhanced LocalBusiness schema
   - [ ] GBP optimization guide delivered
   - [ ] Review template created

3. **Performance:**
   - [ ] Lighthouse score 90+
   - [ ] LCP < 2.5s
   - [ ] CLS < 0.1

4. **Social:**
   - [ ] Open Graph images created
   - [ ] Social sharing buttons on blog

5. **Link Building:**
   - [ ] Directory list provided
   - [ ] Outreach templates created

---

## Deployment Steps

1. **Build:** `docker compose build storefront`
2. **Test:** Run all SEO checks locally
3. **Deploy:** Push to VPS
4. **Verify:** Check all URLs return 200
5. **Submit:** Ping Google with updated sitemap
6. **Monitor:** Watch Search Console for indexing

---

## Estimated Timeline

| Wave | Tasks | Estimated Time |
|------|-------|----------------|
| Wave 1 | Blog infrastructure + 4 posts | 2 hours |
| Wave 2 | GBP + Local SEO | 30 minutes |
| Wave 3 | Performance optimization | 45 minutes |
| Wave 4 | Social media | 30 minutes |
| Wave 5 | Link building docs | 20 minutes |
| Wave 6 | Build + Deploy | 30 minutes |
| **Total** | | **~4 hours** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Build failures | Test locally before deploying |
| SEO score drops | Backup current config; rollback plan |
| Slow performance | Implement progressive enhancement |
| Content quality | Use proven templates; review before publish |

---

## Success Metrics

**Immediate (After Deploy):**
- Blog section accessible
- No 404 errors
- Lighthouse 85+

**Week 1:**
- All pages indexed
- Rich snippets appearing

**Month 1:**
- Blog traffic measurable
- +50% organic traffic

**Month 3-6:**
- Target keywords ranking
- Continuous traffic growth

---

**Ready to execute?** I'll implement all tasks systematically, building the complete Phase 2 SEO infrastructure.
