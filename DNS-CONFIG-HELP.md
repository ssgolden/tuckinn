# DNS Configuration for tuckinnproper.com
**Action Required**: Add 5 DNS A records to your domain registrar

---

## What You Need to Do

Log into your domain registrar and add these 5 A records:

| Record Type | Host/Name | Points to/Value | TTL |
|-------------|-----------|-----------------|-----|
| A | @ | 187.124.217.8 | 300 |
| A | api | 187.124.217.8 | 300 |
| A | admin | 187.124.217.8 | 300 |
| A | staff | 187.124.217.8 | 300 |
| A | www | 187.124.217.8 | 300 |

**"@" means the root domain (tuckinnproper.com with no prefix)**

---

## How to Add DNS (By Registrar)

### ⭐ Cloudflare (Recommended - Fastest)
1. Go to https://dash.cloudflare.com
2. Select your domain **tuckinnproper.com**
3. Click **DNS** in the left menu
4. Click **Add Record**
5. For each record:
   - Type: **A**
   - Name: `@` (or `api`, `admin`, `staff`, `www`)
   - IPv4 address: `187.124.217.8`
   - TTL: Auto or 300
   - Proxy status: **DNS Only** (gray cloud, NOT orange)
6. Click Save

### GoDaddy
1. Log in at https://account.godaddy.com
2. Click **My Products** → **DNS** next to your domain
3. Click **Add** to add new records
4. Type: **A**
5. Name: `@` (or `api`, `admin`, `staff`, `www`)
6. Value: `187.124.217.8`
7. TTL: 600 seconds
8. Click **Save**

### Namecheap
1. Log in at https://ap.www.namecheap.com
2. Go to **Domain List** → Click **Manage** next to tuckinnproper.com
3. Go to **Advanced DNS** tab
4. Under **HOST RECORDS**, click **Add New Record**
5. Type: **A Record**
6. Host: `@` (or `api`, `admin`, `staff`, `www`)
7. Value: `187.124.217.8`
8. TTL: Automatic
9. Click **Save All Changes**

### Google Domains (now Squarespace)
1. Log in at https://domains.squarespace.com
2. Select your domain
3. Go to **DNS** tab
4. Click **Custom records** → **Add**
5. Type: **A**
6. Name: leave blank (for @) or enter `api`, `admin`, `staff`, `www`
7. Data: `187.124.217.8`
8. TTL: 300
9. Click **Add**

---

## After You Add DNS

### 1. Wait 5-30 minutes for propagation

### 2. Test DNS (replace with your actual domain)
Open Command Prompt or Terminal and run:
```bash
nslookup tuckinnproper.com
nslookup api.tuckinnproper.com
nslookup admin.tuckinnproper.com
```

Should all return: `187.124.217.8`

### 3. Run the SSL switch script on your VPS
Once DNS is working, SSH to your VPS and run:
```bash
ssh root@187.124.217.8
bash /opt/tuckinn/platform/SWITCH-TO-REAL-SSL.sh
```

Or I can run it for you - just tell me when DNS is done!

### 4. Test your site
- https://tuckinnproper.com
- https://admin.tuckinnproper.com
- https://staff.tuckinnproper.com
- https://api.tuckinnproper.com/api/health

---

## Need Help?

**Can't find your registrar?**
1. Go to https://who.is
2. Enter: tuckinnproper.com
3. Look for "Registrar" - that's where you need to log in

**Common login URLs:**
- Cloudflare: https://dash.cloudflare.com
- GoDaddy: https://account.godaddy.com
- Namecheap: https://ap.www.namecheap.com
- Google/Squarespace: https://domains.squarespace.com
- Hostinger: https://hpanel.hostinger.com
- Bluehost: https://my.bluehost.com

---

## ✅ Quick Checklist

- [ ] Log into domain registrar
- [ ] Add A record: @ → 187.124.217.8
- [ ] Add A record: api → 187.124.217.8
- [ ] Add A record: admin → 187.124.217.8
- [ ] Add A record: staff → 187.124.217.8
- [ ] Add A record: www → 187.124.217.8
- [ ] Wait 5-30 minutes
- [ ] Test: `nslookup tuckinnproper.com`
- [ ] Run SSL switch script (I can do this)
- [ ] Test your sites

---

## 🆘 Can't Access Your Domain Account?

If you:
- Don't know where you bought the domain
- Forgot login credentials
- Can't access the account

**Options:**
1. Check your email for domain renewal notices - they contain the registrar name
2. Use https://who.is to find the registrar
3. Contact your web developer/IT person who set it up
4. If domain is locked, contact the registrar's support with proof of ownership

---

## After DNS is Configured

Reply to me with: "DNS done"

I'll:
1. Verify DNS propagation
2. Run the SSL certificate switch
3. Test all your sites
4. Confirm everything works

Your site will be live within minutes of you configuring DNS!
