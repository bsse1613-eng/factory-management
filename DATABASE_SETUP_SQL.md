# Database Setup & Maintenance - Product Name Fields

## 🔧 SQL Commands for Supabase

### Prerequisites
- Access to Supabase dashboard
- Admin or editor role for the database
- Both `purchases` and `deliveries` tables should exist

---

## ✅ Add Product Name Column - PURCHASES

```sql
-- Add product_name column to purchases table if it doesn't exist
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Add comment for clarity (optional)
COMMENT ON COLUMN purchases.product_name IS 'Name of the product purchased (e.g., Rice, Wheat, Cotton)';
```

**Verification Query:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'product_name';
```

---

## ✅ Add Product Name Column - DELIVERIES

```sql
-- Add product_name column to deliveries table if it doesn't exist
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Add comment for clarity (optional)
COMMENT ON COLUMN deliveries.product_name IS 'Name of the product delivered (e.g., Finished Goods, Processed Jute)';
```

**Verification Query:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'deliveries' AND column_name = 'product_name';
```

---

## 📋 Update Existing Records (Optional)

### Set default product names for existing purchases without data

```sql
-- Update purchases with NULL product_name to default value
UPDATE purchases 
SET product_name = 'Raw Material'
WHERE product_name IS NULL;
```

### Set default product names for existing deliveries without data

```sql
-- Update deliveries with NULL product_name to default value
UPDATE deliveries 
SET product_name = 'Finished Goods / Product'
WHERE product_name IS NULL;
```

---

## 🔍 Verification Queries

### Check if product_name columns exist

```sql
-- Check purchases table
SELECT * FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;

-- Check deliveries table
SELECT * FROM information_schema.columns 
WHERE table_name = 'deliveries' 
ORDER BY ordinal_position;
```

### View sample data with product names

```sql
-- Purchases with product names
SELECT 
  id, 
  date, 
  supplier_name, 
  product_name, 
  number_of_bags, 
  total_price
FROM purchases 
ORDER BY date DESC 
LIMIT 10;

-- Deliveries with product names
SELECT 
  id, 
  delivery_date, 
  customer_name, 
  product_name, 
  number_of_bags, 
  total_product_price
FROM deliveries 
ORDER BY delivery_date DESC 
LIMIT 10;
```

### Count records with/without product names

```sql
-- Purchases
SELECT 
  COUNT(*) as total_purchases,
  COUNT(product_name) as with_product_name,
  COUNT(*) - COUNT(product_name) as without_product_name
FROM purchases;

-- Deliveries
SELECT 
  COUNT(*) as total_deliveries,
  COUNT(product_name) as with_product_name,
  COUNT(*) - COUNT(product_name) as without_product_name
FROM deliveries;
```

---

## 🚨 Backup Before Changes

```sql
-- Create backup of purchases table
CREATE TABLE IF NOT EXISTS purchases_backup AS
SELECT * FROM purchases;

-- Create backup of deliveries table
CREATE TABLE IF NOT EXISTS deliveries_backup AS
SELECT * FROM deliveries;
```

---

## 🗑️ Cleanup (If Needed)

### Drop the columns (not recommended unless reverting changes)

```sql
-- Remove product_name from purchases
-- ALTER TABLE purchases DROP COLUMN product_name;

-- Remove product_name from deliveries
-- ALTER TABLE deliveries DROP COLUMN product_name;
```

---

## 📊 Data Type Specification

| Column | Type | Nullable | Default | Max Length |
|--------|------|----------|---------|-----------|
| product_name | TEXT | Yes | NULL | Unlimited |

**Note:** TEXT data type allows unlimited length. If you want to limit to specific length, use VARCHAR(n):

```sql
-- Example: Limit to 100 characters
ALTER TABLE purchases 
ALTER COLUMN product_name TYPE VARCHAR(100);
```

---

## 🔄 Migration Script (Complete Setup)

Run this complete script to set up everything:

```sql
-- Step 1: Add columns
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS product_name TEXT;

ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Step 2: Verify columns exist
SELECT 'Purchases table' as table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'purchases'
UNION ALL
SELECT 'Deliveries table', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'deliveries';

-- Step 3: Check data
SELECT 'Purchases' as table_name, COUNT(*) as total_records, COUNT(product_name) as with_product_name
FROM purchases
UNION ALL
SELECT 'Deliveries', COUNT(*), COUNT(product_name)
FROM deliveries;
```

---

## 📝 Supabase SQL Editor Steps

1. Open **Supabase Dashboard**
2. Go to your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL commands above
6. Click **Run** button
7. Check the results

---

## ✨ Best Practices

### 1. Always Backup First
```sql
CREATE TABLE purchases_backup_DATE AS SELECT * FROM purchases;
```

### 2. Test with SELECT Before UPDATE
```sql
-- Check first
SELECT * FROM purchases WHERE product_name IS NULL LIMIT 5;

-- Then update
UPDATE purchases SET product_name = 'Raw Material' 
WHERE product_name IS NULL;
```

### 3. Create Indexes for Performance
```sql
-- Optional: Create index for faster queries
CREATE INDEX idx_purchases_product_name ON purchases(product_name);
CREATE INDEX idx_deliveries_product_name ON deliveries(product_name);
```

### 4. Use Transactions for Safety
```sql
BEGIN;
  -- Your update statements here
  UPDATE purchases SET product_name = 'Raw Material' WHERE product_name IS NULL;
  UPDATE deliveries SET product_name = 'Finished Goods' WHERE product_name IS NULL;
COMMIT;
-- Or ROLLBACK; to cancel
```

---

## 🔍 Common Issues & Solutions

### Issue: "Column already exists"
```
Error: column "product_name" of relation "purchases" already exists
```
**Solution:** Use `IF NOT EXISTS` clause (already included in scripts above)

### Issue: "Permission denied"
```
Error: permission denied for schema public
```
**Solution:** Check your Supabase user role has editor/admin permissions

### Issue: "Query timeout"
```
Error: Query exceeded maximum duration
```
**Solution:** Update in batches if table is very large

---

## 📞 Verification Checklist

- [ ] Connected to correct Supabase project
- [ ] SQL executed without errors
- [ ] Columns appear in information_schema query
- [ ] Sample data shows product_name field
- [ ] Application form submits successfully
- [ ] PDF displays product names
- [ ] No TypeScript compilation errors
- [ ] Branch access controls still working

---

## 🎯 Complete Workflow

```
1. Backup existing data
   ↓
2. Run ADD COLUMN scripts
   ↓
3. Verify columns exist
   ↓
4. Test with sample records
   ↓
5. Update existing records (optional)
   ↓
6. Deploy application
   ↓
7. Monitor for issues
   ↓
8. Success ✅
```

---

## 📅 Deployment Timeline

**Phase 1: Preparation**
- Backup database
- Review SQL scripts

**Phase 2: Database Update**
- Add product_name columns
- Verify columns created

**Phase 3: Application Deploy**
- Deploy updated code to production
- Test with real data

**Phase 4: Verification**
- Check PDF outputs
- Monitor application logs
- Gather user feedback

---

## 🔐 Rollback Plan (If Needed)

```sql
-- If you need to revert the changes:

-- Restore from backup
DROP TABLE purchases;
ALTER TABLE purchases_backup RENAME TO purchases;

DROP TABLE deliveries;
ALTER TABLE deliveries_backup RENAME TO deliveries;
```

---

**Last Updated:** November 28, 2025  
**Database Support:** PostgreSQL (Supabase)  
**Status:** ✅ Ready to Deploy
