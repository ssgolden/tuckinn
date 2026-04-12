# Storefront Builder-First Restyle Design

**Goal:** Make the sandwich builder the main reason to use the Tuckinn storefront, while keeping the menu, meal deals, basket, checkout, and live API flow unchanged.

**Skills Used:** `brainstorming`, `ui-ux-pro-max`, `writing-plans`

**Decision:** Use a builder-first homepage. The current site says the builder exists, but the visual hierarchy still tells customers to browse the menu first. The restyle should make "Build your proper sandwich" the primary promise, then support it with ready-made favourites and meal deals.

---

## Current Problem

The homepage currently positions the ordering routes as:

1. Browse The Menu
2. Open Meal Deals
3. Build A Sandwich

That makes the custom sandwich builder feel like an optional extra. For a premium online ordering brand, the builder should be the differentiator because it gives customers control, makes the site feel more bespoke, and creates a stronger reason to order direct instead of using a generic menu page.

---

## Recommended Direction

Use a "Sandwich Studio" concept:

- The hero should lead with building a sandwich, not general lunch ordering.
- The primary CTA should be `Start Building`, opening the existing builder view.
- The secondary CTA should be `Browse Favourites`, opening the existing menu.
- The route cards should put `Build A Sandwich` first and style it as the signature option.
- A short three-step explainer should sit near the top: choose bread, choose fillings, review and order.
- The builder should feel premium and guided, not like a plain modifier form.
- Mobile should expose the builder CTA immediately because most ordering will happen on phones.

---

## UX Principles

- **Differentiation first:** Customers should understand in five seconds that Tuckinn lets them build their own sandwich.
- **Low friction:** The builder cannot hide meal deals or quick picks. It should be the main route, not the only route.
- **Mobile-first:** The first screen on a phone should include the builder message and a clear builder action.
- **Progressive disclosure:** Show three simple builder steps on the homepage, then show full choices only inside the builder.
- **Premium warmth:** Keep the existing red, cream, and gold brand system, but use richer contrast, tactile cards, and deli-studio language.
- **No fake claims:** Avoid unsupported numbers, fake reviews, or generic "premium" copy that does not explain the ordering advantage.

---

## Homepage Structure

1. Header
   - Keep existing logo and bottom navigation.
   - Add no new route until the builder-first homepage proves itself.

2. Builder-first hero
   - Eyebrow: `Build it your way`
   - Heading: `Build your proper sandwich`
   - Body: Explain bread, fillings, salad, sauce, and quick checkout.
   - Primary CTA: `Start Building`
   - Secondary CTA: `Browse Favourites`
   - Supporting chips: `Bread`, `Fillings`, `Salad`, `Sauce`

3. Sandwich Studio preview
   - Replace the current brand reassurance card with a builder preview card.
   - Show three stacked builder choices with selected-style pills.
   - Show a visible price/review line if current catalog data allows it.
   - Include a CTA inside the card for desktop and tablet.

4. Order path cards
   - First card: `Build A Sandwich`, styled as the signature path.
   - Second card: `Browse The Menu`.
   - Third card: `Open Meal Deals`.
   - Copy should explain when to use each route.

5. Builder explainer
   - Three cards: `Pick your base`, `Layer the flavour`, `Review and order`.
   - Use this instead of generic reassurance panels.

6. Featured favourites
   - Keep popular items below the builder section for people who do not want customisation.

7. Brand proof
   - Shift proof copy away from abstract "premium feel" and toward "built around your lunch, not a generic menu".

---

## Builder View Restyle

The existing builder flow should remain functionally unchanged. The restyle should improve presentation:

- Rename the top kicker from `Customise your order` to `Sandwich Builder`.
- Add a studio-style header that reinforces the selected product.
- Make the progress dots feel like a guided journey.
- Keep the summary sticky on tablet/desktop.
- On mobile, keep navigation buttons large and thumb-friendly.
- Keep required-choice messaging visible and accessible.

---

## Responsive Behaviour

Mobile, 375-430px:

- Hero stacks vertically.
- `Start Building` appears in the first screen.
- Builder preview appears before social proof.
- Bottom navigation keeps `Builder`.
- Add a homepage-only sticky builder CTA if the basket sticky bar is not visible.

Tablet, 768-1024px:

- Hero uses a two-column layout with copy on the left and builder preview on the right.
- The signature builder order card spans the full grid width.
- The explainer uses three compact cards or a wide horizontal row depending on available width.

Laptop/Desktop, 1200px+:

- Hero uses a richer split layout.
- Builder preview should be visually stronger than menu links.
- Order cards can sit three across, but the builder card must remain visually primary.

---

## Accessibility And Performance

- All CTAs must be real buttons with clear accessible names.
- Mobile tap targets must stay at least 44px high.
- The builder preview must not be required to understand or use the page.
- Animations should respect `prefers-reduced-motion`.
- Do not add heavy image dependencies or client-side animation libraries for this phase.
- Keep existing API calls unchanged.

---

## Success Criteria

- The first visible homepage message clearly promotes the sandwich builder.
- The first route card is `Build A Sandwich`.
- Clicking the primary hero CTA opens the existing builder view.
- Mobile, tablet, and laptop layouts all show builder as the main route.
- Checkout and live order submission remain unchanged.
- Existing order-flow tests continue to pass.
