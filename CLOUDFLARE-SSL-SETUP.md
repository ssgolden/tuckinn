# Cloudflare SSL Setup Guide

## Overview
We'll set up Cloudflare SSL using Origin CA certificates. This requires:
1. A domain added to Cloudflare (even a free subdomain works)
2. API token with minimal permissions
3. Caddy configuration update

---

## Step 1: Create Cloudflare API Token (Safest Method)

### Do NOT use your Global API Key!
Instead, create a scoped token with minimal permissions.

### How to Create the Token:

1. Go to: https://dash.cloudflare.com/profile/api-tokens

2. Click **"Create Token"**

3. Use this **Custom Token** configuration:
```
Token name: Tuckinn-Caddy-SSL
Permissions:
  - Zone:Read
  - DNS:Edit

Zone Resources:
  - Include: Specific zone: yourdomain.com (or All zones if you prefer)

Client IP Address Filtering: (leave empty)
TTL: 1 year (or your preference)
```

4. Click **"Continue to summary"** then **"Create Token"**

5. **COPY THE TOKEN IMMEDIATELY** - it won't be shown again!

---

## Step 2: Enter the Token Safely

### Method A: Direct SSH (Safest for you)

Run this on YOUR machine (Windows PowerShell/CMD):

```powershell
# SSH into your VPS
ssh root@187.124.217.8

# Create the env file securely
mkdir -p /opt/tuckinn/platform/infra/docker/secrets
echo "CLOUDFLARE_API_TOKEN=your_token_here" > /opt/tuckinn/platform/infra/docker/secrets/cloudflare.env
chmod 600 /opt/tuckinn/platform/infra/docker/secrets/cloudflare.env
```

### Method B: I'll do it for you (Secure input)

If you're comfortable, paste the token here and I'll:
1. Create the file directly on the VPS
2. Set restrictive permissions (600 - only root can read)
3. Never expose it in logs or output

**⚠️ Security note**: I'll write the file directly without echoing the token.

---

## Step 3: Update Caddy Configuration

Once the token is in place, we need to:

1. Add Cloudflare DNS challenge module to Caddy
2. Update Caddyfile to use the token
3. Configure for Origin CA certificates

### Option A: DNS Challenge (if you have a domain)

If you have a real domain (not sslip.io), Caddy can use Cloudflare DNS to validate Let's Encrypt certificates:

```caddyfile
yourdomain.com {
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
    reverse_proxy storefront:3000
}
```

### Option B: Origin CA Certificate (Recommended for now)

Since you're using sslip.io, we'll:
1. Generate a Cloudflare Origin CA certificate
2. Upload it to your VPS securely
3. Configure Caddy to use it

---

## Step 4: Choose Your Path

### Path A: Keep using sslip.io (Self-signed, Testing only)

**Pros**: Free, quick  
**Cons**: "Not Secure" warning, not for production  
**Action**: Accept the certificate warning in browser

### Path B: Get a free subdomain (Best free option)

Services that offer free subdomains:
- No-IP.com
- Duck DNS
- Dynu.com
- FreeDNS (afraid.org)

Then point that subdomain to Cloudflare.

### Path C: Buy a domain ($8-15/year) - RECOMMENDED

**Best providers**:
- Namecheap (~$9/year for .com)
- Cloudflare Registrar (~$9/year, no markup)
- Porkbun (~$9/year)

**Once you have a domain**:
1. Point nameservers to Cloudflare
2. Add A records to your VPS IP
3. Caddy auto-gets Let's Encrypt certificates
4. No more "Not Secure" warnings
5. Professional appearance

---

## My Recommendation

For a business like Tuckinn Proper:

**Immediate** (today): Register a simple domain like:
- `tuckinn.de` (~$6/year)
- `tuckinn.shop` (~$10/year)
- `tuckinn.app` (~$12/year)

**Why**: 
- Customers trust real domains
- Automatic SSL via Caddy + Let's Encrypt
- Better SEO
- Looks professional

**Alternative** (if budget is tight):
Use Cloudflare Tunnel (free) - I can set this up to tunnel your VPS through Cloudflare's network with automatic SSL, no domain needed.

---

## Next Steps

**Please choose one:**

1. **"I have a domain"** - I'll help you configure Cloudflare DNS and SSL
2. **"I'll buy a domain"** - I'll wait, then configure it
3. **"Use Cloudflare Tunnel"** - Free SSL without buying a domain
4. **"I'll accept the self-signed cert"** - For testing only

Which option works for you?
