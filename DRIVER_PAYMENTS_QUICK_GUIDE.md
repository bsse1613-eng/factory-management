# Driver Payment Tracking - Quick Reference

## 🎯 What's New?

You can now track exactly how much money each driver is owed and how much has been paid to them, including demurrage charges for unloading delays.

## 📍 Where to Find It

### From Trucks List:
1. **Orange Dollar Button (💲)** - Click to add a demurrage cost
   - Only for owners
   - Pre-fills truck & driver info
   - Perfect for recording waiting charges

### From Truck Detail Page:
1. **4 New Statistics Cards** at the top:
   - `Driver Payable` - Total money owed to driver
   - `Driver Paid` - Total paid so far
   - `Driver Due` - Balance remaining
   - `Total Transportations` - Number of trips

2. **Driver Payment Records Section** - Shows all payments:
   - Regular payments
   - Demurrage charges
   - Advance payments

3. **Add Payment Button** (green) - Record driver payments
   - Any payment type
   - Flexible amounts
   - Optional notes

## 💰 Payment Types

| Type | When to Use | Example |
|------|------------|---------|
| **Regular** | Standard delivery compensation | Payment for delivery to Sirajganj |
| **Demurrage** | Unloading delays/waiting time | 2-hour waiting charge = ৳500 |
| **Advance** | Money given before delivery | Advance for fuel/expenses |

## ✅ Workflow Example

### Step 1: Driver makes delivery
- Delivery recorded in system
- Driver cost = ৳5000 + ৳500 extra = ৳5500 total owed

### Step 2: Add demurrage charge (if delayed)
- Go to Trucks page
- Click 💲 button on truck
- Enter: Payment Date, Amount (৳500), Notes ("2-hour unload delay")
- Click "Add Cost"
- Driver Due now shows ৳5500

### Step 3: Pay the driver
- Go to Truck Detail
- Click "Add Payment"
- Enter: Date, Amount (৳5500), Payment Type (Regular), Notes
- Click "Add Payment"
- Driver Due now shows ৳0 ✅

## 📊 Statistics Example

```
Total Transportations: 15
┌─────────────────┬───────────┐
│ Driver Payable  │ ৳45,500   │  (Total earned)
│ Driver Paid     │ ৳42,000   │  (Already paid)
│ Driver Due      │ ৳3,500    │  (Still owed)
└─────────────────┴───────────┘
```

## 🔐 Permissions

| Action | Owner | Employee |
|--------|-------|----------|
| View payments | ✅ | ✅ |
| Add payment | ✅ | ❌ |
| Add demurrage | ✅ | ❌ |
| Delete record | ✅ | ❌ |

## 🎮 Demo Mode

Try without Supabase:
- Login as demo user
- Mock data automatically loads
- All features work in memory
- Refresh page to reset

## ⚠️ Important

1. **Track all delays** - Don't forget demurrage charges
2. **Record payments immediately** - Keep balance accurate
3. **Check before payments** - Always verify "Due" amount
4. **Save receipts** - Keep driver payment documentation

## 🚀 Quick Actions

### Add Demurrage from Trucks Page
```
Trucks Page → Find Truck → Click 💲 → Fill Form → Click "Add Cost"
```

### View Driver Status
```
Trucks Page → Click "View Details" → See 4 cards at top
```

### Record Payment
```
Truck Detail → Click "Add Payment" → Fill Form → Click "Add Payment"
```

### Check Payment History
```
Truck Detail → Scroll to "Driver Payment Records" → See all transactions
```

## 📋 Fields to Fill

### When Adding Demurrage Cost:
- ✏️ Payment Date (YYYY-MM-DD)
- ✏️ Amount (in ৳)
- ✏️ Notes (optional, but helpful!)

### When Adding Payment:
- ✏️ Payment Date
- ✏️ Amount
- ✏️ Payment Type (dropdown)
- ✏️ Notes (optional)

## 🔗 Database Setup

For Supabase users, run: `TRUCK_DRIVER_PAYMENTS.sql`

Creates table with:
- Driver payment records
- Auto-timestamp updates
- Security policies (RLS)
- Performance indexes

## 💡 Tips

1. **Demurrage Button Only Visible to Owners** - Employees won't see it
2. **Demo Data Included** - Truck "Mohammed Rahman" has sample payments
3. **Red Due Amount** - Indicates driver is owed money
4. **Date Filtering** - Supports any payment date
5. **Bulk Entry** - Can add multiple payments at once

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't see 💲 button | Login as owner (not employee) |
| Payment not saving | Check Supabase table exists |
| Wrong balance | Verify all deliveries recorded |
| Can't edit | Owners only, check role |

## 📞 Common Questions

**Q: Can employees see payments?**
A: Yes (read-only). They can view but can't add/edit.

**Q: What if I enter wrong amount?**
A: Refresh page to reset demo mode, or contact admin for edit.

**Q: Do demurrage charges auto-calculate?**
A: No, you must add them manually. Check for delays.

**Q: Can I add payment from past?**
A: Yes, pick any date in the date field.

**Q: Is there a report?**
A: View Driver Payment Records section, or use delivery reports.
