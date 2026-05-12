# P0 TASKS - INTERACTIVE EXECUTION GUIDE
**For**: Stephen / TuckInn Proper  
**Date**: April 17, 2026  
**Status**: 🔴 ACTIVE - Awaiting Credentials

---

## 📋 WHAT YOU NEED TO DO (Right Now)

### ✅ SEND ME THESE 3 THINGS:

```
1. Google Analytics ID: G-XXXXXXXXXX
   (Get from: https://analytics.google.com)

2. Stripe Publishable Key: pk_live_XXXXXXXXX
   (Get from: https://dashboard.stripe.com)

3. Stripe Secret Key: sk_live_XXXXXXXXX
   (Get from: https://dashboard.stripe.com)

4. Your Business Address (for GBP):
   [Street, City, Country, Postal Code]
```

**Once you send these, I'll complete everything within 1 hour!** 🚀

---

## 🔥 STEP-BY-STEP: Get All Credentials (60 minutes)

### PART 1: Google Analytics (15 minutes)

**Open:** https://analytics.google.com

1. Sign in with Google account
2. Click "Start measuring"
3. Property name: "TuckInn Proper"
4. Industry: "Food & Drink"
5. Time zone: [Select yours]
6. Currency: EUR
7. Click "Create"
8. Website URL: https://tuckinnproper.com
9. Stream name: "TuckInn Website"
10. Click "Create stream"
11. **⭐ COPY: "Measurement ID: G-XXXXXXXXXX"**
    - Example: G-A1B2C3D4E5

**✅ DONE! You have your GA4 ID**

---

### PART 2: Stripe Live (30 minutes)

**Open:** https://dashboard.stripe.com

1. Sign in to Stripe account
2. Look for red banner: "Activate your account"
3. Click "Complete profile"
4. Fill business details:
   - Business type: "Sole Proprietorship" or "LLC/Ltd"
   - Industry: "Food & Beverage"
   - Business website: https://tuckinnproper.com
   - Address: [Your business address]
   - Tax ID: [Your VAT number or personal tax ID]
5. Add bank account for payouts:
   - Enter bank details
   - Verify (instant OR 2-day micro-deposits)
6. Accept Stripe terms
7. Click "Activate"
8. Wait for approval (usually instant to 24 hours)
9. Go to: https://dashboard.stripe.com/apikeys
10. **⭐ COPY: Publishable key (pk_live_...)**
11. **⭐ COPY: Secret key (sk_live_...)** [Click "Reveal"]

**✅ DONE! You have Stripe keys**

---

### PART 3: Google Business Profile - Start Now (15 minutes)

**Open:** https://business.google.com

1. Click "Add your business to Google"
2. Business name: "TuckInn Proper"
3. Category: "Restaurant" or "Sandwich shop"
4. Address: [Enter your address]
   - OR select "I deliver goods and services to my customers" if no physical location
5. Service area: [Your delivery area]
6. Phone: +34 627 755 609
7. Website: https://tuckinnproper.com
8. Click "Finish"
9. Request verification:
   - **Postcard** (3-5 days) - Most common
   - **Phone** (instant) - If available
   - **Email** (instant) - If available
10. Choose your verification method
11. Upload 5-10 photos while waiting:
    - Food photos
    - Interior/exterior
    - Logo
    - Team photos

**⏳ WAIT: 3-5 days for postcard verification**

---

## 📤 TEMPLATE: Send Me This

Copy and paste this with your actual information:

```
🔴 P0 CREDENTIALS FOR TUCKINN

1. GOOGLE ANALYTICS:
   Measurement ID: G-XXXXXXXXXX
   (Replace with your actual ID)

2. STRIPE LIVE KEYS:
   Publishable: pk_live_XXXXXXXXX
   Secret: sk_live_XXXXXXXXX
   
3. GBP STATUS:
   Verification method chosen: [Postcard/Phone/Email]
   Status: [Pending / Done]
   
4. BUSINESS ADDRESS:
   [Full address for GBP if not yet submitted]

5. BUSINESS HOURS:
   Mon-Fri: [00:00 - 00:00]
   Saturday: [00:00 - 00:00]
   Sunday: [00:00 - 00:00] or Closed
```

---

## ⚙️ WHAT I'LL DO (Once you send credentials)

### Immediate (When you send GA4 + Stripe):

**Step 1: Update layout.tsx** (2 minutes)
```bash
1. Replace G-PLACEHOLDER with your G-XXXXXXXXXX
2. Save file
```

**Step 2: Update Stripe config** (3 minutes)
```bash
1. SSH to VPS
2. Update .env.production with:
   STRIPE_PUBLISHABLE_KEY=pk_live_XXX
   STRIPE_SECRET_KEY=sk_live_XXX
```

**Step 3: Build and deploy** (10 minutes)
```bash
1. Build storefront
2. Deploy to production
3. Verify HTTPS 200
```

**Step 4: Test everything** (10 minutes)
```bash
1. Test GA4 tracking
2. Test Stripe payment flow
3. Verify order completes
4. Check order notification
```

**✅ DONE! Time from credentials to live: 30 minutes**

---

### GBP Continuation (3-5 days later when verified):

Once you receive verification:

**Step 5: GBP Optimization** (I'll guide you)
```
1. Complete all business info
2. Upload remaining photos
3. Set up messaging
4. Add Q&A section
5. Create first post
```

**✅ DONE! GBP fully optimized**

---

## ⏱️ TIMELINE SUMMARY

### TODAY (60 minutes):
- **09:00**: Create GA4 → Get ID (15 min)
- **09:15**: Create Stripe → Get keys (30 min)
- **09:45**: Start GBP → Submit verification (15 min)
- **10:00**: Send me credentials

### TODAY (30 minutes after credentials):
- **10:00**: Deploy GA4 + Stripe
- **10:30**: ✅ Live payments working

### DAYS 2-7:
- **Wait**: 3-5 days for GBP verification postcard
- **Track**: Analytics data flowing in
- **Monitor**: First real orders

### WEEK 2:
- **Complete**: GBP fully optimized
- **Appearing**: On Google Maps and local searches
- **Earning**: Real revenue from customers

---

## 📞 QUICK LINKS

| Service | URL | Purpose |
|---------|-----|---------|
| Google Analytics | https://analytics.google.com | Create GA4 property |
| Stripe Dashboard | https://dashboard.stripe.com | Activate live payments |
| Google Business | https://business.google.com | Create GBP profile |
| Your Site | https://tuckinnproper.com | Test after deployment |

---

## 🆘 IF YOU GET STUCK

**On Google Analytics:**
- Can't find ID? → Check: Admin → Data Streams → Web
- Example shows G-PLACEHOLDER? → That's the template, your real ID will be G-XXXXXXXXXX

**On Stripe:**
- "Activate your account" button missing? → Already activated! Go to API keys
- Verification pending? → Normal, can take 24-48 hours for some accounts
- "Secret key" greyed out? → Click "Reveal", may need password

**On GBP:**
- Only postcard option? → Normal for new businesses, wait 3-5 days
- "Pending review"? → Submit anyway, Google will review
- Can't edit after submission? → Can edit after verification

---

## 💰 EXPECTED RESULTS

### After GA4 + Stripe deployed (Today):
✅ See visitors on Realtime dashboard  
✅ Process first real payment  
✅ Get order confirmation email  

### After GBP verified (3-7 days):
✅ Appear on Google Maps  
✅ Show in "food near me" searches  
✅ Get first Google customer  

### Month 1:
✅ 100+ GBP profile views  
✅ 50+ website visitors from Google  
✅ 20-50 orders from organic traffic  
✅ €500-1,500 revenue  

---

## 🎯 YOUR ACTION RIGHT NOW

Pick ONE to start:

**EASIEST** → **Google Analytics** (15 min, instant gratification)  
🔗 https://analytics.google.com

**MOST IMPORTANT** → **Google Business Profile** (15 min, 3-5 day wait)  
🔗 https://business.google.com

**MOST URGENT** → **Stripe** (30 min, makes money today)  
🔗 https://dashboard.stripe.com

**Or do all 3 in parallel** (60 min total)

---

## ✅ CHECKLIST TO SEND ME

When ready, make sure you have:

```
☐ GA4 ID copied (looks like: G-A1B2C3D4E5)
☐ Stripe Publishable key copied (starts with: pk_live_)
☐ Stripe Secret key copied (starts with: sk_live_)
☐ GBP started (at minimum: created and submitted)
☐ Business hours decided (for GBP)
☐ Address confirmed (for GBP)
```

**Send all info in ONE message** to avoid confusion!

---

## 🔥 READY? SEND NOW!

**Just reply with:**

```
GA4 ID: G-XXXXXXXXXX
Stripe PK: pk_live_XXXXXXX
Stripe SK: sk_live_XXXXXXX
GBP: [Started/Done/Pending]
```

**I'll immediately deploy everything! 🚀**

---

*Current Time: Waiting for credentials*  
*Status: Ready to execute within 1 hour*  
*Files prepared: All code ready for deployment*
