# SQL Deployment - Quick Copy-Paste Guide

**Just want to run it? Copy sections below and paste into Supabase SQL Editor.**

---

## ⚡ FASTEST DEPLOYMENT (Copy All at Once)

Open file: `PAYMENT_FEATURE_DATABASE.sql`  
**Copy:** Everything from line 1 to line 460  
**Paste:** Into Supabase SQL Editor  
**Click:** Run

✅ Done! All tables, indexes, and configurations will be created.

---

## 📊 Alternative: Run In Sections

If you prefer to run step-by-step:

### SECTION 1: Create Tables (Lines 8-71)
**Copy and Run First:**

```sql
-- Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  supplier_id UUID,
  supplier_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(100),
  notes TEXT,
  added_by UUID,
  added_by_name VARCHAR(255),
  added_by_role VARCHAR(50),
  status VARCHAR(50) DEFAULT 'verified',
  reference_number VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  CONSTRAINT positive_amount CHECK (amount > 0),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Create customer_payments table
CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id UUID,
  customer_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(100),
  notes TEXT,
  added_by UUID,
  added_by_name VARCHAR(255),
  added_by_role VARCHAR(50),
  status VARCHAR(50) DEFAULT 'verified',
  reference_number VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  CONSTRAINT positive_amount CHECK (amount > 0),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
```

---

### SECTION 2: Create Indexes (Lines 73-90)
**Copy and Run Second:**

```sql
-- Supplier Payments Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_payments_id ON supplier_payments(id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_created_at ON supplier_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_name ON supplier_payments(supplier_name);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_payment_date ON supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_added_by ON supplier_payments(added_by);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_status ON supplier_payments(status);

-- Customer Payments Indexes
CREATE INDEX IF NOT EXISTS idx_customer_payments_id ON customer_payments(id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_created_at ON customer_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_name ON customer_payments(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customer_payments_added_by ON customer_payments(added_by);
CREATE INDEX IF NOT EXISTS idx_customer_payments_status ON customer_payments(status);
```

---

### SECTION 3: Views (Lines 380-430)
**Copy and Run Third (Optional but Recommended):**

```sql
-- Supplier Payment Summary View
CREATE OR REPLACE VIEW supplier_payment_summary AS
SELECT 
  s.id,
  s.supplier_name,
  s.source_location,
  s.branch,
  COALESCE(SUM(p.total_price), 0) as total_purchases,
  COALESCE(SUM(sp.amount), 0) as total_payments,
  (COALESCE(SUM(p.total_price), 0) - COALESCE(SUM(sp.amount), 0)) as outstanding_balance,
  COUNT(DISTINCT sp.id) as payment_count,
  MAX(sp.payment_date) as last_payment_date
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_name = p.supplier_name
LEFT JOIN supplier_payments sp ON s.supplier_name = sp.supplier_name
  AND sp.status = 'verified'
GROUP BY s.id, s.supplier_name, s.source_location, s.branch;

-- Customer Payment Summary View
CREATE OR REPLACE VIEW customer_payment_summary AS
SELECT 
  c.id,
  c.customer_name,
  c.customer_address,
  c.branch,
  COALESCE(SUM(d.total_product_price), 0) as total_sales,
  COALESCE(SUM(cp.amount), 0) as total_payments,
  (COALESCE(SUM(d.total_product_price), 0) - COALESCE(SUM(cp.amount), 0)) as outstanding_balance,
  COUNT(DISTINCT cp.id) as payment_count,
  MAX(cp.payment_date) as last_payment_date
FROM customers c
LEFT JOIN deliveries d ON c.customer_name = d.customer_name
LEFT JOIN customer_payments cp ON c.customer_name = cp.customer_name
  AND cp.status = 'verified'
GROUP BY c.id, c.customer_name, c.customer_address, c.branch;
```

---

## 🧪 VERIFICATION Queries

Run these AFTER deployment to verify everything works:

### Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('supplier_payments', 'customer_payments');
```

**Expected Result:**
```
table_name
─────────────────────
supplier_payments
customer_payments
```

### Check if indexes exist:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('supplier_payments', 'customer_payments')
ORDER BY indexname;
```

**Expected Result:** (14 indexes total)
```
indexname
─────────────────────────────────────────
idx_supplier_payments_added_by
idx_supplier_payments_created_at
idx_supplier_payments_id
... (and more)
```

### Check if views exist:
```sql
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('supplier_payment_summary', 'customer_payment_summary');
```

**Expected Result:**
```
viewname
──────────────────────────────
supplier_payment_summary
customer_payment_summary
```

---

## 📝 SAMPLE DATA INSERT

Once tables are created, test with sample data:

```sql
-- Insert a sample supplier payment
INSERT INTO supplier_payments (
  supplier_name,
  amount,
  payment_date,
  payment_method,
  notes,
  added_by_name,
  added_by_role,
  reference_number
) VALUES (
  'Prottoy',
  50000,
  '2025-11-30',
  'Bank Transfer',
  'Payment for rice purchase',
  'Prodip',
  'employee',
  'BANK-20251130-001'
);

-- Check if insert worked
SELECT * FROM supplier_payments;
```

---

## 🚨 COMMON DEPLOYMENT ISSUES & FIXES

### Issue 1: "Relation does not exist"
**Cause:** Tables might already exist  
**Fix:** Use `IF NOT EXISTS` (already included)

### Issue 2: "Foreign key constraint"
**Cause:** suppliers/customers tables don't exist  
**Fix:** Make sure base tables exist first

### Issue 3: "Type does not exist"
**Cause:** Old SQL syntax (already fixed!)  
**Fix:** Use the corrected SQL file

### Issue 4: Slow performance
**Cause:** Indexes not created  
**Fix:** Run SECTION 2 (Indexes)

---

## ✅ DEPLOYMENT CHECKLIST

After running SQL, verify:

- [ ] Tables created successfully
- [ ] 14 Indexes created
- [ ] Views created (2 views)
- [ ] Can insert sample data
- [ ] Queries return results
- [ ] No errors in SQL Editor

---

## 📞 TROUBLESHOOTING

If something goes wrong:

1. **Copy full file:** `PAYMENT_FEATURE_DATABASE.sql`
2. **Clear SQL Editor** - Select all, delete
3. **Paste fresh copy** - Entire file
4. **Run it** - Click Run button
5. **Wait** - Let it complete

If still issues:
- Check PostgreSQL syntax (not MySQL)
- Verify you're in correct Supabase project
- Look at error message - usually very clear
- Check line number of error

---

## 🎯 WHAT YOU GET

After successful deployment:

✅ `supplier_payments` table - Track payments to suppliers  
✅ `customer_payments` table - Track payments from customers  
✅ 14 Performance indexes - Fast queries  
✅ 2 Reporting views - Pre-built summaries  
✅ Triggers - Auto-update timestamps  
✅ Ready to use in React app  

---

**Ready? Open Supabase SQL Editor and paste the SQL file now!**

Generated: November 30, 2025
