# Tuckinn Storefront Animation Slice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtle, conversion-friendly storefront animations that improve feedback and flow without making the UI feel busy.

**Architecture:** Keep the animation layer lightweight and user-focused. Use CSS motion for staged reveals and hover feedback, and small React state for transient add-to-basket confirmation and sticky basket CTA reveal.

**Tech Stack:** Next.js, React, TypeScript, global CSS, Playwright

---

## Best 3 Animations

1. Section reveal on homepage
2. Add-to-basket success feedback
3. Sticky basket bar reveal with basket pulse

## Phase 1

- [ ] Add failing order-flow expectations for add confirmation and sticky basket bar
- [ ] Keep the user in the menu after adding an item
- [ ] Animate basket count/status and sticky basket CTA
- [ ] Add lightweight staged reveal motion for homepage sections
- [ ] Verify with storefront build and Playwright
