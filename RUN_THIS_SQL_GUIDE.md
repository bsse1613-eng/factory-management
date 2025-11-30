# How to Add Payment Tables to Your Supabase Database

## 📋 Quick Summary

You have **2 new tables** to add to your existing schema:
- `supplier_payments` - Tracks payments made to suppliers
- `customer_payments` - Tracks payments received from customers

## 🚀 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy and Paste the SQL

1. Open this file: `PAYMENT_TABLES_TO_ADD.sql`
2. Copy **ALL** the content
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button

### Step 3: Verify Tables Were Created

After running the SQL, you should see:
- ✅ 2 new tables created
- ✅ 12 indexes created
- ✅ 2 views created
- ✅ 2 triggers created
- ✅ RLS policies enabled

---

## 📊 What Each Table Does

### supplier_payments
```
Stores: Payments made to suppliers
Tracks: Who added it, when, how much, payment method, notes
Used by: Owner in SupplierProfile page
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique payment ID |
| `supplier_name` | TEXT | Which supplier |
| `amount` | NUMERIC | How much paid |
| `payment_date` | DATE | When paid |
| `added_by_name` | TEXT | Who added it (e.g., "Prodip") |
| `added_by_role` | TEXT | Was it owner or employee |
| `status` | TEXT | verified/pending/cancelled |
| `created_at` | TIMESTAMP | When created |

### customer_payments
```
Stores: Payments received from customers
Tracks: Who added it, when, how much, payment method, notes
Used by: Owner in CustomerProfile page
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique payment ID |
| `customer_name` | TEXT | Which customer |
| `amount` | NUMERIC | How much received |
| `payment_date` | DATE | When received |
| `added_by_name` | TEXT | Who added it (e.g., "Prodip") |
| `added_by_role` | TEXT | Was it owner or employee |
| `status` | TEXT | verified/pending/cancelled |
| `created_at` | TIMESTAMP | When created |

---

## 🔑 Key Features

✅ **Tracks Who Added Payment**
- Shows name and role (owner/employee)
- "Added by Prodip" appears on payment records

✅ **Audit Trail**
- Records when payment was created
- Records when payment was updated
- Records who updated it

✅ **Payment Status**
- `verified` - Confirmed payment
- `pending` - Awaiting verification
- `cancelled` - Payment was cancelled

✅ **Security (RLS)**
- Only owners can view all payments
- Employees can insert payments
- Only owners can update payments

✅ **Performance**
- 6 indexes for fast queries
- Views for easy reporting
- Automatic timestamp updates with triggers

---

## 🧪 Test the Setup

After running the SQL, test it with these queries:

### Test 1: Check if tables exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('supplier_payments', 'customer_payments');
```
**Expected:** 2 rows returned

### Test 2: Insert a test supplier payment
```sql
INSERT INTO public.supplier_payments (
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
  'Test',
  'Test payment',
  'Test User',
  'owner'
);
```
**Expected:** INSERT successful

### Test 3: View the inserted payment
```sql
SELECT * FROM public.supplier_payments LIMIT 1;
```
**Expected:** Your test payment appears

---

## ⚙️ What Gets Created

### Tables (2)
- `supplier_payments`
- `customer_payments`

### Indexes (6)
For fast queries on:
- Created date
- Supplier/Customer ID
- Supplier/Customer name
- Payment date
- Who added it (added_by)
- Status

### Views (2)
For reporting:
- `supplier_payment_summary` - Total payments per supplier
- `customer_payment_summary` - Total payments per customer

### Triggers (2)
- Auto-updates `updated_at` timestamp when payment changes

### RLS Policies (6)
- Owners can view all payments
- Employees can add payments
- Only owners can edit payments

---

## 🔗 How It Connects to Your App

When you click **"Add Payment"** in the profile page:

```
1. Owner clicks "Add Payment" button
2. Modal opens with form
3. Owner enters:
   - Amount
   - Payment Date
   - Payment Method (optional)
   - Notes (optional)
4. On submit:
   - Data saved to supplier_payments or customer_payments
   - Automatically recorded who added it (userProfile.name)
   - Automatically recorded their role (userProfile.role)
5. Payment appears in history with "added by Prodip" tag
```

---

## ⚠️ Important Notes

1. **Run all at once** - Copy the entire file and run it
2. **Don't skip RLS** - Security policies are important
3. **Check for errors** - If any error, run each section separately
4. **Test before production** - Run test queries after setup

---

## 🆘 Troubleshooting

### Error: "table already exists"
- This is OK! The SQL has `IF NOT EXISTS`
- Just means the table is already there

### Error: "role not found"
- This can happen with RLS policies
- Try removing RLS section and run tables first

### Indexes fail to create
- Try creating them manually one by one
- Or skip them (they're for performance only)

---

## ✅ Completion Checklist

After running the SQL:

- [ ] Supabase shows no errors
- [ ] "supplier_payments" table exists
- [ ] "customer_payments" table exists
- [ ] Can insert test payment
- [ ] Can view test payment
- [ ] Views show in "Views" section
- [ ] Triggers are created
- [ ] RLS policies are enabled

---

## 📞 Questions?

Check these files:
- `PAYMENT_FEATURE_DATABASE.sql` - Original full schema
- `PAYMENT_DATABASE_GUIDE.md` - Detailed guide
- `PAYMENT_SETUP_INSTRUCTIONS.md` - Setup help

---

**Ready?** Copy the SQL from `PAYMENT_TABLES_TO_ADD.sql` and paste into Supabase SQL Editor! 🚀
