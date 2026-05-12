# TuckInn Platform Integration Test Plan
**Objective**: Verify full connectivity between Storefront, Admin, Staff, and API
**Date**: 2026-04-17
**Domain**: tuckinnproper.com

---

## System Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Customer   │     │   Admin     │     │   Staff     │
│  (Browser)  │     │ (Mgmnt)     │     │ (Orders)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────┴──────┐
                    │    API      │
                    │  (Backend)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────┴────┐  ┌───┴────┐  ┌────┴────┐
         │Postgres │  │ Redis  │  │Uploads  │
         │(DB)     │  │ (Cache)│  │(Files)  │
         └─────────┘  └────────┘  └─────────┘
```

## Test Categories

### 1. Health Check Tests
- All containers running
- API responding correctly
- Database connectivity

### 2. Storefront Tests (Customer Portal)
- Homepage loads
- Menu displays
- Product details view
- Cart functionality
- Checkout process
- Account creation/login
- Order placement

### 3. Admin Tests (Management Portal)
- Login authentication
- Dashboard access
- Product CRUD operations
- Order management
- Customer management
- Settings/configurations
- Analytics viewing

### 4. Staff Tests (Order Management)
- Login authentication
- Real-time order notifications
- Order status updates
- Kitchen display functionality
- Customer communication

### 5. Integration Flow Tests
- Order creation flow (Storefront → API → Staff)
- Status update flow (Staff → API → Storefront)
- Inventory sync (Admin changes → Storefront)
- User session handling

### 6. Real-time Tests
- WebSocket connections
- Live order updates
- Notification delivery

---

## Test Execution Steps

## Phase 1: Infrastructure Health
### Test 1.1: Container Status
```bash
Command: docker compose ps
Expected: All 7 containers running and healthy
```

### Test 1.2: API Health Check
```bash
URL: https://api.tuckinnproper.com/api/health
Expected: {"status":"ok","database":"connected"}
```

### Test 1.3: Database Connectivity
```bash
Test: Query via API endpoint
Expected: Response time < 500ms, valid JSON
```

## Phase 2: Storefront Tests
### Test 2.1: Homepage Load
```
URL: https://tuckinnproper.com
Check: HTML loads, CSS renders, no console errors
```

### Test 2.2: Menu Display
```
URL: https://tuckinnproper.com/menu
Check: Products load, images display, prices correct
```

### Test 2.3: Product Detail
```
Action: Click any product
Check: Detail modal/page opens, description visible
```

### Test 2.4: Cart Functionality
```
Action: Add item to cart
Check: Cart indicator updates, item appears in cart
```

### Test 2.5: Checkout Flow
```
Action: Proceed to checkout
Check: Form loads, payment options visible
```

### Test 2.6: Customer Auth
```
Action: Register new account / Login
Check: Auth token received, session persistent
```

### Test 2.7: Order Placement
```
Action: Complete test order (if test payment available)
Check: Order confirmation, order ID generated
```

## Phase 3: Admin Portal Tests
### Test 3.1: Admin Login
```
URL: https://admin.tuckinnproper.com
Credentials: RichRonHoll@tuckinn.local / Tuckinn2026!
Check: Login successful, dashboard loads
```

### Test 3.2: Dashboard Access
```
Check: Metrics load, charts render, recent orders visible
```

### Test 3.3: Product Management
```
Action: View products, edit product, save changes
Check: Changes persist, store front updates
```

### Test 3.4: Order Management
```
Action: View orders, update order status
Check: Status updates, customer notifications sent
```

### Test 3.5: Customer Management
```
Action: View customer list, view customer details
Check: Data loads correctly
```

### Test 3.6: Settings Configuration
```
Action: Access settings, modify business hours
Check: Changes save, apply to storefront
```

## Phase 4: Staff Portal Tests
### Test 4.1: Staff Login
```
URL: https://staff.tuckinnproper.com
Credentials: RichRonHoll@tuckinn.local / Tuckinn2026!
Check: Login successful, staff dashboard loads
```

### Test 4.2: Order Board
```
Check: Orders display, real-time updates working
```

### Test 4.3: Order Status Updates
```
Action: Update order status (preparing → ready)
Check: Status updates in UI, notifications sent
```

### Test 4.4: Kitchen Display (if applicable)
```
Check: Order tickets display correctly
```

## Phase 5: Integration Flow Tests
### Test 5.1: End-to-End Order Flow
```
Step 1: Customer places order (Storefront)
Step 2: Verify order appears in Staff dashboard
Step 3: Verify order appears in Admin panel
Step 4: Staff updates status
Step 5: Verify status updates in all systems
```

### Test 5.2: Inventory Sync
```
Step 1: Admin marks product as unavailable
Step 2: Verify product shows as unavailable in Storefront
Step 3: Admin marks product available
Step 4: Verify product reappears in Storefront
```

### Test 5.3: User Session Management
```
Check: Sessions persist across page refreshes
Check: Secure cookies set correctly
Check: Logout functionality works
```

## Phase 6: Real-time Functionality
### Test 6.1: WebSocket Connection
```
Check: Staff dashboard connects via WebSocket
Check: No connection errors
```

### Test 6.2: Live Updates
```
Action: Place order while Staff dashboard is open
Check: Order appears in real-time without refresh
```

### Test 6.3: Notification Delivery
```
Check: Order status change triggers notification
```

---

## Test Results Template

| Test ID | Component | Test Name | Status | Notes |
|---------|-----------|-----------|--------|-------|
| TEST-1.1 | Infrastructure | Container Health | ⏳ | |
| TEST-1.2 | Infrastructure | API Health | ⏳ | |
| TEST-1.3 | Infrastructure | Database Connectivity | ⏳ | |
| TEST-2.1 | Storefront | Homepage Load | ⏳ | |
| TEST-2.2 | Storefront | Menu Display | ⏳ | |
| TEST-2.3 | Storefront | Product Detail | ⏳ | |
| TEST-2.4 | Storefront | Cart Functionality | ⏳ | |
| TEST-2.5 | Storefront | Checkout Flow | ⏳ | |
| TEST-2.6 | Storefront | Customer Auth | ⏳ | |
| TEST-3.1 | Admin | Login | ⏳ | |
| TEST-3.2 | Admin | Dashboard | ⏳ | |
| TEST-3.3 | Admin | Product Management | ⏳ | |
| TEST-3.4 | Admin | Order Management | ⏳ | |
| TEST-3.5 | Admin | Customer Management | ⏳ | |
| TEST-4.1 | Staff | Login | ⏳ | |
| TEST-4.2 | Staff | Order Board | ⏳ | |
| TEST-4.3 | Staff | Status Updates | ⏳ | |
| TEST-5.1 | Integration | End-to-End Order | ⏳ | |
| TEST-5.2 | Integration | Inventory Sync | ⏳ | |
| TEST-6.1 | Real-time | WebSocket | ⏳ | |
| TEST-6.2 | Real-time | Live Updates | ⏳ | |

---

## Success Criteria

✅ **90% of tests passing** = System fully functional  
⚠️ **70-89% passing** = System functional with minor issues  
❌ **< 70% passing** = Critical issues requiring immediate attention  

---

## Quick Test Commands

### Test API
```bash
curl -s https://api.tuckinnproper.com/api/health
curl -s https://api.tuckinnproper.com/api/catalog/public
```

### Test Frontends
```bash
curl -s -o /dev/null -w "%{http_code}" https://tuckinnproper.com
curl -s -o /dev/null -w "%{http_code}" https://admin.tuckinnproper.com
curl -s -o /dev/null -w "%{http_code}" https://staff.tuckinnproper.com
```

### Check WebSocket (requires manual browser test)
Open browser console on staff page and check for:
```javascript
// Should show WebSocket connection
console.log(window.socket?.connected)
```

---

## Issue Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| 🔴 **Critical** | System down or core functionality broken | Immediate fix |
| 🟠 **High** | Major feature not working | Fix within 24h |
| 🟡 **Medium** | Feature works with workarounds | Fix within week |
| 🟢 **Low** | Cosmetic/minor issues | Schedule fix |

---

## Rollback Plan

If critical issues found:
1. Document issues
2. Assess impact
3. Determine if rollback needed
4. If rollback: Restore previous Docker image
5. Schedule fix and redeploy

---

**Start executing tests?** Let's verify your entire platform is working!
