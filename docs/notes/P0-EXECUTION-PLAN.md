# P0 Critical Tasks - Execution Plan
**Status**: IN PROGRESS  
**Started**: April 17, 2026

---

## Task 1: Google Business Profile Setup
**Status**: ⏳ READY TO EXECUTE
**Owner**: Requires your Google account
**Estimated Time**: 2 hours
**Impact**: ⭐⭐⭐⭐⭐ Essential for local SEO

### Steps:
1. Go to https://business.google.com
2. Click "Add your business to Google"
3. Search for existing business or create new
4. Select business type: Restaurant/Food
5. Add business name: "TuckInn Proper"
6. Add address (or service area if delivery-only)
7. Add phone: +34 627 755 609
8. Add website: https://tuckinnproper.com
9. Verify via phone/mail
10. Upload photos (10+ photos)
11. Add business hours
12. Write description
13. Add menu items
14. Enable messaging

### Deliverables:
- ✅ GBP created and verified
- ✅ Business shows on Google Maps
- ✅ Appears in "food near me" searches
- ✅ Messaging connected to WhatsApp

---

## Task 2: Google Analytics 4 + Search Console
**Status**: ⏳ READY TO EXECUTE
**Owner**: Can implement on VPS
**Estimated Time**: 1.5 hours
**Impact**: ⭐⭐⭐⭐⭐ Data tracking

### Steps:
1. Create GA4 property
2. Get tracking code (G-XXXXXXXXXX)
3. Add to storefront layout.tsx
4. Set up conversion events
5. Create Search Console property
6. Verify domain ownership
7. Submit sitemap
8. Add users

### Deliverables:
- ✅ GA4 tracking live
- ✅ Events firing (page_view, order_complete)
- ✅ Search Console connected
- ✅ Sitemap submitted
- ✅ Monthly reports configured

---

## Task 3: Stripe Live Payment Activation
**Status**: ⏳ READY TO EXECUTE
**Owner**: Requires Stripe account
**Estimated Time**: 3 hours
**Impact**: ⭐⭐⭐⭐⭐ MAKES MONEY

### Steps:
1. Log into Stripe dashboard
2. Complete business verification
3. Add bank account for payouts
4. Review and accept TOS
5. Switch from test to live mode
6. Update API keys in .env.production
7. Test live payment flow
8. Set up webhook endpoints
9. Add order confirmation logic

### Deliverables:
- ✅ Live payments processing
- ✅ First real order successful
- ✅ Webhooks working
- ✅ Order confirmation emails sending

---

## Dependency Graph

```
Task 1 (GBP) ─┐
              ├──> Task 4 (Marketing can start)
Task 2 (GA) ───┤
              ├──> Task 5 (Optimization can start)
Task 3 (Stripe)┘──> Task 6 (Revenue tracking)
```

## Parallel Execution

Tasks 1, 2, 3 can run in PARALLEL:
- Task 1: User action (you create GBP)
- Task 2: VPS implementation (I add code)
- Task 3: User + VPS (activate Stripe, update keys)

---

## Current Plan

### Immediate Actions (Now)
1. I'll start implementing Task 2 (Analytics) on VPS
2. You start Task 1 (GBP) on business.google.com
3. We'll coordinate Task 3 (Stripe) together

Let's begin!
