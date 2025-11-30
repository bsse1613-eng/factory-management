# Payment Feature - Database Setup Instructions

**Status:** Ready to Deploy  
**Date:** November 30, 2025

---

## 🎯 What This Does

Adds payment tracking to Supplier and Customer profiles with:
- ✅ Record payments made to suppliers
- ✅ Record payments received from customers
- ✅ Track who added the payment (Owner or Employee name)
- ✅ Automatic timestamps
- ✅ Payment status management (verified/pending/cancelled)
- ✅ Complete audit trail

---

## 📦 Files Needed

1. **PAYMENT_FEATURE_DATABASE.sql** - All database tables and queries
2. **PAYMENT_DATABASE_GUIDE.md** - How to use the database

---

## 🚀 Setup Steps

### Step 1: Go to Supabase Dashboard
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project (Alankar Agro)
3. Go to **SQL Editor** in left sidebar

### Step 2: Create New Query
1. Click **New Query** button (top right)
2. You'll see a blank SQL editor

### Step 3: Copy SQL Code
1. Open file: `PAYMENT_FEATURE_DATABASE.sql`
2. Copy ALL the code (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor (Ctrl+V)

### Step 4: Run the Query
1. Click **Run** button (or Ctrl+Enter)
2. Wait for success message
3. You'll see: "2 rows affected" (or similar)

### Step 5: Verify Tables Created
1. Go to **Table Editor** in left sidebar
2. Refresh the page (F5)
3. You should see two new tables:
   - `supplier_payments`
   - `customer_payments`

---

## ✅ Verification Checklist

After running the SQL, verify everything is working:

- [ ] Two new tables exist: `supplier_payments` and `customer_payments`
- [ ] Both tables have columns for: amount, payment_date, added_by_name, added_by_role, status, notes
- [ ] Views created: `supplier_payment_summary` and `customer_payment_summary`
- [ ] Indexes are created (for performance)
- [ ] RLS policies are enabled

---

## 🧪 Test the Setup

### Test 1: Add a Supplier Payment
```sql
INSERT INTO supplier_payments (
  supplier_name,
  amount,
  payment_date,
  payment_method,
  notes,
  added_by_name,
  added_by_role
) VALUES (
  'Test Supplier',
  10000,
  '2025-11-30',
  'Cash',
  'Test payment',
  'Test Owner',
  'owner'
);
```

Expected: "1 row inserted successfully"

### Test 2: Add a Customer Payment
```sql
INSERT INTO customer_payments (
  customer_name,
  amount,
  payment_date,
  payment_method,
  notes,
  added_by_name,
  added_by_role
) VALUES (
  'Test Customer',
  15000,
  '2025-11-30',
  'Cash',
  'Test payment from employee',
  'Prodip',
  'employee'
);
```

Expected: "1 row inserted successfully"

### Test 3: Query the Data
```sql
SELECT * FROM supplier_payments;
SELECT * FROM customer_payments;
```

Expected: You should see the test records you just added

### Test 4: Get Summary View
```sql
SELECT * FROM supplier_payment_summary;
SELECT * FROM customer_payment_summary;
```

Expected: Shows supplier/customer details with payment totals

---

## 🔗 How It Connects to the App

### In SupplierProfile.tsx
When owner clicks "Add Payment":
1. Opens payment modal
2. Enters amount, date, notes
3. Clicks "Record Payment"
4. Data is inserted into `supplier_payments` table
5. Automatically sets:
   - `added_by_name` = logged-in user's name
   - `added_by_role` = 'owner'
   - `created_at` = current timestamp
   - `status` = 'verified'

### In CustomerProfile.tsx
Same process but for `customer_payments` table

### Employee Record
When employee (like "Prodip") adds payment:
- Shows: **"Added by Prodip (Employee)"**
- Stored as: `added_by_name='Prodip'`, `added_by_role='employee'`

---

## 📊 Important Queries

### Get All Supplier Payments
```sql
SELECT * FROM supplier_payments 
WHERE status = 'verified'
ORDER BY payment_date DESC;
```

### Get Supplier Outstanding Balance
```sql
SELECT 
  s.supplier_name,
  SUM(p.total_price) as total_purchased,
  SUM(sp.amount) as total_paid,
  (SUM(p.total_price) - SUM(sp.amount)) as balance_due
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_name = p.supplier_name
LEFT JOIN supplier_payments sp ON s.supplier_name = sp.supplier_name
  AND sp.status = 'verified'
GROUP BY s.supplier_name;
```

### Get Customer Outstanding Balance
```sql
SELECT 
  c.customer_name,
  SUM(d.total_product_price) as total_sales,
  SUM(cp.amount) as total_paid,
  (SUM(d.total_product_price) - SUM(cp.amount)) as balance_due
FROM customers c
LEFT JOIN deliveries d ON c.customer_name = d.customer_name
LEFT JOIN customer_payments cp ON c.customer_name = cp.customer_name
  AND cp.status = 'verified'
GROUP BY c.customer_name;
```

---

## 🛡️ Security Features

### Row Level Security (RLS)
- Only owners can view all payments
- Automatic enforcement at database level
- No need for manual checks

### Audit Trail
- Every payment records:
  - Who added it (name)
  - Their role (owner/employee)
  - When it was added (timestamp)
  - When it was updated

### Constraints
- Amounts must be positive
- Required fields: supplier_name, amount, payment_date
- Status options: verified, pending, cancelled

---

## ⚠️ Troubleshooting

### Problem: "Table already exists"
- **Solution**: Add `IF NOT EXISTS` (already in our code)
- Just run the SQL again, it won't cause issues

### Problem: "Permission denied"
- **Solution**: Check Supabase role has permission to create tables
- Might need to use admin key or owner account

### Problem: "Column doesn't exist"
- **Solution**: Refresh page and verify table was created
- Check in Table Editor that new columns appear

### Problem: "RLS policy failed"
- **Solution**: RLS policies only apply on SELECT
- Make sure your user has proper auth role set

---

## 🔄 Backup Before Running

### Create a Backup Query
```sql
-- Backup current data (if tables exist)
SELECT * FROM purchases LIMIT 1;
SELECT * FROM deliveries LIMIT 1;
SELECT * FROM suppliers LIMIT 1;
SELECT * FROM customers LIMIT 1;
```

This helps verify your data is intact before adding new tables.

---

## ✨ After Setup

### Next Steps:
1. ✅ Run SQL in Supabase
2. ✅ Verify tables exist
3. ✅ Test with sample data
4. ✅ Users can now add payments in profiles
5. ✅ Payments show "Added by [Name]" with role

### Features Available:
- ✅ Owner can add payment to supplier profile
- ✅ Owner can add payment to customer profile
- ✅ Employee adds payment, name shows as "Added by [Name]"
- ✅ View payment history in profile
- ✅ See financial summary with payments
- ✅ Track outstanding balances

---

## 📞 Support

**Issue:** Tables not showing up after setup
- **Fix:** Refresh Supabase dashboard (F5)
- **Fix:** Clear browser cache (Ctrl+Shift+Delete)

**Issue:** Can't insert data
- **Fix:** Check status is one of: 'verified', 'pending', 'cancelled'
- **Fix:** Make sure amount is a number

**Issue:** Query returns no results
- **Fix:** Make sure records actually exist (run SELECT * first)
- **Fix:** Check status filter (might need status = 'verified')

---

## 📋 Database Schema Summary

```
supplier_payments
├── id (UUID)
├── supplier_name (VARCHAR)
├── amount (DECIMAL)
├── payment_date (DATE)
├── payment_method (VARCHAR)
├── notes (TEXT)
├── added_by_name (VARCHAR) ← Shows who added it
├── added_by_role (VARCHAR) ← Shows if owner or employee
├── status (VARCHAR)
├── reference_number (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

customer_payments
├── id (UUID)
├── customer_name (VARCHAR)
├── amount (DECIMAL)
├── payment_date (DATE)
├── payment_method (VARCHAR)
├── notes (TEXT)
├── added_by_name (VARCHAR) ← Shows who added it
├── added_by_role (VARCHAR) ← Shows if owner or employee
├── status (VARCHAR)
├── reference_number (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 🎉 All Done!

Your payment tracking system is now ready:
- Database tables created
- Indexes for performance
- Views for reports
- RLS security
- Audit trail enabled

**Ready to track payments!**

---

**Created:** November 30, 2025  
**Status:** Production Ready ✅
