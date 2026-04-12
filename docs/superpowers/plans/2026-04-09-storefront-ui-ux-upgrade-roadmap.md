# Tuckinn Storefront UI/UX Upgrade Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the storefront into a more premium, higher-conversion lunch ordering experience without changing the proven checkout architecture.

**Architecture:** Keep the current Next.js storefront and continue improving it in vertical slices: trust and conversion copy first, then menu desire, then builder and basket optimization. Every slice stays behind the existing Playwright storefront harness so UI work does not break the menu-to-basket path.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS, Playwright, pnpm

---

## Design Direction

- Premium deli, not generic app shell
- Dark espresso text, warm cream surfaces, restrained gold accent
- Fast-order clarity before decorative flourishes
- Social proof and reassurance close to the hero
- Strong mobile-first conversion surfaces
- Minimal motion with full contrast/accessibility discipline

## Upgrade List

### Phase 1: Trust And Conversion Copy
- [ ] Add a customer-facing social-proof section below the hero
- [ ] Replace strategy/internal wording with customer-facing reassurance everywhere
- [ ] Add “local favourite”, “popular at lunch”, and “quick pick” cues where they help scanning
- [ ] Keep the first-screen CTA hierarchy extremely clear

### Phase 2: Homepage Conversion Depth
- [ ] Add stronger proof of quality and repeatability using text-only testimonial/review style cards
- [ ] Tighten the hero copy further to shorten decision time
- [ ] Improve “Why order here” so it feels premium without sounding corporate

### Phase 3: Menu Merchandising
- [ ] Keep quick lunch items visually first
- [ ] Add clearer bestselling and recommended markers
- [ ] Improve product-card hierarchy so name, price, and action read faster
- [ ] Strengthen category stories so each section has a reason to browse

### Phase 4: Builder And Basket
- [ ] Make the builder feel guided rather than technical
- [ ] Improve progress and summary language
- [ ] Add basket reassurance, checkout clarity, and suggested add-ons
- [ ] Add a stronger sticky mobile order CTA

### Phase 5: Polish And Validation
- [ ] Accessibility contrast and motion pass
- [ ] Mobile spacing and tap-target pass
- [ ] Final storefront build and Playwright verification

## Immediate Execution Order

1. Social-proof section
2. Hero copy tightening
3. Best-seller / popularity cues
4. Builder guidance
5. Basket reassurance and upsells

## Phase 1 Start

### Task 1: Add Homepage Social Proof

**Files:**
- Create: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\social-proof.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\content.ts`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\page.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\globals.css`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\home.spec.ts`

- [ ] Write a failing homepage test for a visible social-proof section
- [ ] Run the homepage test and confirm it fails
- [ ] Add a reusable social-proof component with three concise proof cards
- [ ] Wire it into the homepage directly under the hero/trust layer
- [ ] Add styling that feels premium but text-first and mobile-friendly
- [ ] Run storefront build and Playwright again
