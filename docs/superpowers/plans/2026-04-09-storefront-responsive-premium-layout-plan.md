# Storefront Responsive Premium Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the storefront so it feels premium and conversion-focused on laptop, tablet, and mobile instead of behaving like a narrow phone shell on every screen.

**Architecture:** Keep the current Next.js storefront and current checkout architecture, but introduce a real responsive layout system with breakpoint-aware containers, adaptive section compositions, and device-specific CTA behavior. Build this in vertical slices so homepage, menu, builder, and basket each become screen-aware without breaking the tested order flow.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS, Playwright, pnpm

---

## Why This Phase Matters

Current issue:
- `platform/apps/storefront/app/globals.css` still uses a phone-first shell cap (`--max-mobile: 500px`) and a single-column app frame for large parts of the experience.
- That keeps mobile acceptable, but it wastes tablet and laptop space and reduces premium perception.
- High-end storefronts do not simply "stretch"; they change hierarchy, density, CTA placement, and panel behavior by breakpoint.

Target breakpoints:
- Mobile: `375-767px`
- Tablet portrait/landscape: `768-1023px`
- Laptop and desktop: `1024-1439px`
- Large desktop: `1440px+`

## Best Skills To Use

- `ui-ux-pro-max`: responsive visual system, touch ergonomics, premium hierarchy.
- `nextjs-developer`: App Router-safe responsive structure and image/metadata choices.
- `react-expert`: component decomposition for breakpoint-aware sections.
- `typescript-pro`: keep responsive view models and props explicit.
- `playwright-expert`: cross-device E2E coverage for real breakpoints.
- `test-master`: responsive regression strategy and coverage gaps.
- `verification-before-completion`: sequential verification and no false green claims.
- `code-reviewer`: final review for layout regressions, a11y drift, and over-complexity.

## Recommended Agent Setup

- Main agent: own sequencing, integration, and responsive design decisions.
- Explorer agent: audit current storefront components and classify what should stay single-column vs become two-column / split-panel at each breakpoint.
- Worker 1: shell, layout tokens, global responsive primitives, nav/header/footer.
- Worker 2: homepage and menu responsive compositions.
- Worker 3: builder, basket, and checkout responsive conversion flow.
- Worker 4: Playwright viewport coverage, mobile/tablet/laptop verification, and regression fixes.

Ownership split:
- Layout system: `platform/apps/storefront/app/globals.css`, `platform/apps/storefront/app/layout.tsx`
- Homepage/menu: `platform/apps/storefront/app/page.tsx`, `platform/apps/storefront/app/_storefront/*.tsx`
- Builder/basket: `platform/apps/storefront/app/page.tsx`, `platform/apps/storefront/app/_storefront/*.tsx`
- Tests: `platform/playwright.config.ts`, `platform/tests/storefront/*.spec.ts`

## Responsive Design Rules

- Mobile stays fast, thumb-friendly, and single-primary-CTA.
- Tablet becomes a spacious browsing layout, not a stretched phone.
- Laptop gets stronger editorial composition, wider content rails, and better comparative scanning.
- Minimum tap target on touch devices: `44x44px`.
- Minimum spacing between adjacent touch targets: `8px`.
- Use `Image fill` in responsive image containers where applicable.
- Use `priority` only for true above-the-fold visual assets.
- Keep motion subtle and preserve `prefers-reduced-motion`.

## Phase Breakdown

### Phase 1: Responsive Foundations

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\globals.css`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\layout.tsx`
- Test: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\home.spec.ts`

- [ ] Replace the narrow storefront shell cap with a breakpoint-aware container system.
- [ ] Introduce layout tokens for mobile, tablet, laptop, and large desktop spacing.
- [ ] Add responsive max-width containers for hero, content sections, menu, builder, and basket.
- [ ] Make the sticky header and sticky basket behavior breakpoint-aware instead of one-size-fits-all.
- [ ] Add/expand Playwright checks that homepage loads cleanly at mobile, tablet, and laptop widths.

### Phase 2: Homepage Responsive Composition

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\page.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\globals.css`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\hero.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\trust-strip.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\social-proof.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\featured-grid.tsx`
- Test: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\home.spec.ts`

- [ ] Turn the homepage from a stacked mobile stream into adaptive compositions.
- [ ] Keep single-column on phone.
- [ ] Move to balanced multi-column trust/proof/featured layouts on tablet and laptop.
- [ ] Tighten line lengths, CTA alignment, and whitespace rhythm for premium reading on larger screens.
- [ ] Ensure hero CTA grouping stays obvious and not split awkwardly on tablet.

### Phase 3: Menu Scanning Across Devices

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\page.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\globals.css`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\menu-rail.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\category-story.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\product-card.tsx`
- Test: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\order-flow.spec.ts`

- [ ] Keep mobile menu compact and touch-first.
- [ ] Promote tablet to a cleaner browse mode with more visible category context.
- [ ] Give laptop a higher-end catalog feel with stronger card grid rhythm and improved scan speed.
- [ ] Make the category rail and filter controls easier to use on tablet without consuming hero-level space.
- [ ] Preserve quick-order speed on mobile while giving larger screens more merchandising room.

### Phase 4: Builder, Basket, And Checkout Responsiveness

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\page.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\globals.css`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\builder-guide.tsx`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\_storefront\basket-upsells.tsx`
- Test: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\order-flow.spec.ts`

- [ ] Keep the builder single-focus on phone.
- [ ] Use split stage/summary layout on tablet and laptop where it helps decisions.
- [ ] Make basket rows and checkout form spacing more readable on tablet.
- [ ] Prevent the checkout panel from feeling too narrow or too stretched on larger screens.
- [ ] Keep the sticky mobile CTA strong while reducing visual redundancy on laptop.

### Phase 5: High-End Polish By Device Class

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\globals.css`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\app\page.tsx`
- Modify: relevant `platform/apps/storefront/app/_storefront/*.tsx`
- Test: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\home.spec.ts`
- Test: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\order-flow.spec.ts`

- [ ] Tune typography scale by breakpoint so headings do not simply scale linearly.
- [ ] Rebalance borders, shadows, and surface density for laptop where more restraint reads as premium.
- [ ] Increase touch area sizes only where touch devices need them, not globally.
- [ ] Add device-appropriate empty states and loading states where layouts shift materially.
- [ ] Review hover behavior so desktop gets feedback while touch devices stay clean.

### Phase 6: Verification Matrix

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\playwright.config.ts`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\home.spec.ts`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\tests\storefront\order-flow.spec.ts`

- [ ] Add explicit viewport projects or loops for phone, tablet, and laptop.
- [ ] Verify homepage CTAs, menu entry, builder flow, basket review, and checkout entry at all 3 device classes.
- [ ] Keep verification sequential to avoid the known `.next` corruption path in this repo.
- [ ] Rebuild from a clean `.next` before any final review server launch on `localhost:7000`.

## Highest-Value Upgrades This Plan Will Deliver

1. Remove the “stretched phone app” feel on laptop.
2. Make tablet genuinely useful for browsing and ordering.
3. Preserve fast mobile ordering while improving premium perception.
4. Reduce responsive friction in the builder and basket.
5. Create a real device-class QA matrix so responsive quality stays stable.

## Recommended Execution Order

1. Phase 1: responsive foundations
2. Phase 2: homepage responsive composition
3. Phase 3: menu scanning
4. Phase 4: builder and basket
5. Phase 5: premium polish
6. Phase 6: verification matrix and final review

## Risks To Watch

- Overusing large-screen whitespace can make the site feel empty rather than premium.
- Reusing mobile CTA patterns unchanged on laptop can make the page feel amateur.
- Running Playwright and `next build` concurrently can produce false failures in this repo.
- Adding too many breakpoint-specific exceptions in one file will make maintenance worse; split components where responsibility is clear.
