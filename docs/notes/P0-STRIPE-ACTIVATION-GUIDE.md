# Stripe Live Payment Activation Guide
**Status**: P0 Critical - MAKES MONEY  
**Time**: 2-3 hours  
**Impact**: ⭐⭐⭐⭐⭐ First real order!

---

## Why This Matters

Currently your store is in **TEST MODE**:
- ❌ Customers can't pay real money
- ❌ Orders don't process
- ❌ No revenue

**After Stripe Live**: ✅ Real payments, real orders, real revenue!

---

## Prerequisites

Before activating Stripe Live, you need:

1. ✅ Stripe account created (https://stripe.com)
2. ✅ Email verified
3. ✅ Business type selected
4. ✅ Bank account for payouts

---

## Step-by-Step Activation

### Step 1: Complete Business Verification

1. Log into Stripe Dashboard: https://dashboard.stripe.com
2. Look for red notification: "Activate your account"
3. Click "Start" or "Complete profile"

### Step 2: Fill Business Details

| Field | What to Enter | Tips |
|-------|---------------|------|
| **Business Type** | "Sole Proprietorship" or "LLC"/"Ltd" | Choose based on your legal structure |
| **Industry** | "Restaurant" or "Food & Beverage" | Select closest match |
| **Business Website** | https://tuckinnproper.com | Required |
| **Business Description** | "Online ordering platform for fresh lunch and sandwiches" | Be clear |
| **Address** | Your business address | Must be real |
| **Tax ID** | Your VAT/EIN/Tax number | Required for payouts |

### Step 3: Add Bank Account for Payouts

1. Go to Settings → Bank accounts and scheduling
2. Click "Add bank account"
3. Enter your bank details:
   - Bank name
   - Account number
   - IBAN (Europe) / Routing number (US)
4. Verify via micro-deposits (2-3 days) OR instant verification

**Important**: Use business bank account if you have one. Personal is OK for sole proprietors.

### Step 4: Review and Accept Terms

1. Review Stripe's terms of service
2. Accept rates (typically 2.9% + €0.30 per transaction in EU, 2.9% + $0.30 in US)
3. Check prohibited businesses (make sure food delivery is allowed - it is!)

### Step 5: Activate Live Mode

1. Dashboard toggle: "Test" → "Live"
2. Or: https://dashboard.stripe.com/account/activate
3. Click "Activate account"
4. Wait for review (usually instant, sometimes 24-48 hours)

---

## Get Your API Keys

Once activated, get NEW LIVE keys:

### Step 1: Get Publishable Key
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy "Publishable key" (starts with: pk_live_...)
3. **SAVE THIS SECURELY** - This goes in your frontend

### Step 2: Get Secret Key
1. Same page, click "Reveal" on "Secret key"
2. Copy "Secret key" (starts with: sk_live_...)
3. **SAVE THIS VERY SECURELY** - This goes in your backend only!

### Step 3: Webhook Secret (Optional but Recommended)
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: https://api.tuckinnproper.com/api/webhooks/stripe
4. Select events: checkout.session.completed, payment_intent.succeeded
5. Copy webhook secret (starts with: whsec_...)

---

## What I Need to Update (Send Me)

Once you have the keys, send me:

```
STRIPE PUBLISHABLE KEY: pk_live_...
STRIPE SECRET KEY: sk_live_...
STRIPE WEBHOOK SECRET: whsec_... (if created)
```

**I'll then:**
1. ✅ Update .env.production on VPS
2. ✅ Verify Stripe config
3. ✅ Rebuild and deploy
4. ✅ Test live payment flow

---

## Testing Live Payments

### Before Going Public

**Test Order #1: Small Test**
1. Place order on your site
2. Use real payment method
3. Pay €1-2 (real money, refundable)
4. Verify:
   - ✅ Payment succeeds
   - ✅ Order received
   - ✅ Confirmation sent
   - ✅ Money appears in Stripe

**Test Order #2: Real Scenario**
1. Full order with multiple items
2. Check calculation accuracy
3. Verify emails work
4. Test refund process (if needed)

### Common Issues

| Issue | Solution |
|-------|----------|
| Payment declined | Customer card issue OR 3D Secure not configured |
| Currency error | Check EUR/USD setting matches your market |
| Webhook fails | Check endpoint URL and secret |
| Tax calculation | Set up tax rates in Stripe if required |

---

## Configure Your Payment Settings

### Recommended Settings

#### In Stripe Dashboard → Settings → Checkout:
- ✅ **Brand name**: "TuckInn Proper"
- ✅ **Logo**: Upload your logo
- ✅ **Accent color**: #25D366 (WhatsApp green) or your brand color
- ✅ **Default language**: Auto-detect or your language

#### Local Payment Methods (Europe)
Enable if available:
- ✅ Cards (Visa, Mastercard, Amex)
- ✅ SEPA Direct Debit (European customers)
- ✅ iDEAL (Netherlands)
- ✅ Bancontact (Belgium)
- ✅ Giropay (Germany)

#### Security
- ✅ 3D Secure (EU requirement)
- ✅ Radar (fraud protection - usually auto-enabled)

---

## Order Flow with Live Payments

### Customer Journey
1. Customer browses menu
2. Adds items to cart
3. Clicks "Checkout"
4. Enters delivery/pickup info
5. **Stripe Checkout opens** ✨ (secure Stripe-hosted page)
6. Customer enters card details
7. Payment processed
8. Success page shown
9. Order confirmed email sent
10. **You receive order notification** 🎉

### Your Process
1. Get order notification (email + staff portal)
2. Prepare order
3. Update status in staff portal
4. Hand over/deliver
5. Mark complete

---

## Payout Schedule

**Stripe payouts to your bank:**
- **Standard**: 7 days rolling (e.g., Monday's earnings available next Monday)
- **Accelerated** (available after history): 2 days
- **Instant** (US only): 30 minutes (small fee)

**For Europe**: Typically 7-day rolling for new accounts

---

## Fees Breakdown

### Stripe Transaction Fees (Example: €20 order)

| Item | Amount |
|------|--------|
| Order Total | €20.00 |
| Stripe Fee (2.9% + €0.30) | €0.88 |
| **You Receive** | **€19.12** |

### Monthly Volume Estimates

| Orders/Month | Revenue | Processing Fees | Net |
|--------------|---------|-----------------|-----|
| 50 | €1,000 | €29 | €971 |
| 100 | €2,000 | €58 | €1,942 |
| 500 | €10,000 | €290 | €9,710 |

**Note**: Fees vary by country and payment method. See Stripe pricing for exact rates.

---

## Webhook Configuration (Advanced)

### What Webhooks Do
Webhooks notify your system when payments complete:
- ✅ Order confirmed instantly
- ✅ No polling needed
- ✅ Better for customer experience

### Events to Track
1. `checkout.session.completed` - Payment successful
2. `payment_intent.payment_failed` - Payment failed
3. `charge.refunded` - Refund processed

### Webhook Handler (I'll set up)
Endpoint: `POST https://api.tuckinnproper.com/api/webhooks/stripe`

Payload:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_...",
      "customer_email": "customer@example.com",
      "amount_total": 2000,
      "metadata": {
        "order_id": "12345"
      }
    }
  }
}
```

---

## Compliance & Taxes

### Required (Check your country)
- ✅ VAT/GST registration (if threshold crossed)
- ✅ Receipts with VAT breakdown
- ✅ Refund policy clearly stated
- ✅ Privacy policy linked

### Receipt Generation
Stripe automatically sends receipts if:
- Customer email provided
- Receipt email setting enabled

Or we'll email custom receipts from your system.

---

## Quick Activation Checklist

### Today (30 minutes)
- [ ] Log into Stripe dashboard
- [ ] Update business profile
- [ ] Link bank account
- [ ] Submit activation request

### When Approved (15 minutes)
- [ ] Copy LIVE API keys (pk_live_... and sk_live_...)
- [ ] Send keys to me securely
- [ ] I'll update VPS configuration
- [ ] Test live payment

### First Order (Goal!)
- [ ] Place test order
- [ ] Pay with real card
- [ ] Verify order received
- [ ] Process order
- [ ] Celebrate! 🎉

---

## Security Best Practices

### ✅ DO
- Keep secret key SECURE (backend only)
- Use HTTPS for all requests
- Monitor webhook signatures
- Log payment events

### ❌ DON'T
- Share secret keys in email/chat
- Store keys in frontend code
- Ignore webhook signature verification
- Skip 3D Secure for EU customers

---

## Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **Support**: https://stripe.com/contact
- **Status**: https://status.stripe.com
- **Test Cards**: https://stripe.com/docs/testing

---

## 🚀 YOUR ACTION

**Start this now (30 minutes):**

1. Go to https://dashboard.stripe.com
2. Click "Complete your profile" or "Activate"
3. Fill in business details
4. Add bank account
5. Submit activation
6. **Send me API keys when approved**

**I'll handle the rest!**

---

*Remember: This is how you make money! 💰*
