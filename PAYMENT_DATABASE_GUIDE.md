# Payment Feature Database Guide

**File:** `PAYMENT_FEATURE_DATABASE.sql`

---

## 📋 Database Tables

### 1. **supplier_payments**
Stores all payments made to suppliers

**Columns:**
- `id` - Unique identifier
- `supplier_name` - Name of supplier
- `amount` - Payment amount (৳)
- `payment_date` - Date of payment
- `payment_method` - How payment was made (Bank Transfer, Cash, etc.)
- `notes` - Additional notes
- `added_by_name` - Who added this payment
- `added_by_role` - Role of person who added (owner/employee)
- `status` - Payment status (verified/pending/cancelled)
- `reference_number` - For tracking (e.g., check number, transaction ID)
- `created_at` - When record was created
- `updated_at` - When record was last updated

**Example Use:**
When an owner clicks "Add Payment" on supplier profile and adds ৳50,000 payment, a row is created with `added_by_role='owner'` and `added_by_name='Owner Name'`

---

### 2. **customer_payments**
Stores all payments received from customers

**Same structure as supplier_payments but for customers**

**Example Use:**
When an employee named "Prodip" records a ৳75,000 payment from a customer, the record shows `added_by_name='Prodip'` and `added_by_role='employee'`

---

## 🔍 Key Queries

### Get All Payments for a Supplier
```sql
SELECT * FROM supplier_payments 
WHERE supplier_name = 'Prottoy Traders'
ORDER BY payment_date DESC;
```

### Get Total Amount Paid to a Supplier
```sql
SELECT 
  supplier_name,
  COUNT(*) as transactions,
  SUM(amount) as total_paid
FROM supplier_payments
WHERE supplier_name = 'Prottoy Traders'
  AND status = 'verified'
GROUP BY supplier_name;
```

### Get Supplier Balance (What's Due)
```sql
SELECT 
  s.supplier_name,
  SUM(p.total_price) as total_purchased,
  SUM(sp.amount) as total_paid,
  (SUM(p.total_price) - SUM(sp.amount)) as due
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_name = p.supplier_name
LEFT JOIN supplier_payments sp ON s.supplier_name = sp.supplier_name
WHERE sp.status = 'verified'
GROUP BY s.supplier_name;
```

### Get Customer Balance (What They Owe)
```sql
SELECT 
  c.customer_name,
  SUM(d.total_product_price) as total_sales,
  SUM(cp.amount) as total_paid,
  (SUM(d.total_product_price) - SUM(cp.amount)) as due
FROM customers c
LEFT JOIN deliveries d ON c.customer_name = d.customer_name
LEFT JOIN customer_payments cp ON c.customer_name = cp.customer_name
WHERE cp.status = 'verified'
GROUP BY c.customer_name;
```

### Get Payments by Employee
```sql
SELECT * FROM customer_payments
WHERE added_by_name = 'Prodip'
  AND added_by_role = 'employee'
ORDER BY payment_date DESC;
```

### Get Daily Payment Summary
```sql
SELECT 
  payment_date,
  COUNT(*) as transactions,
  SUM(amount) as total
FROM supplier_payments
WHERE status = 'verified'
GROUP BY payment_date
ORDER BY payment_date DESC;
```

---

## ➕ How to Add Data

### Add a Supplier Payment
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
  'Prottoy Traders',
  50000,
  '2025-11-30',
  'Bank Transfer',
  'Payment for rice',
  'Owner Name',
  'owner'
);
```

### Add a Customer Payment
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
  'Jamuna Mills',
  75000,
  '2025-11-30',
  'Cash',
  'Payment received',
  'Prodip',
  'employee'
);
```

---

## ✏️ How to Update Data

### Mark Payment as Verified
```sql
UPDATE supplier_payments
SET status = 'verified'
WHERE id = 'payment-id-here';
```

### Update Payment Notes
```sql
UPDATE customer_payments
SET notes = 'New notes here'
WHERE id = 'payment-id-here';
```

### Cancel a Payment
```sql
UPDATE supplier_payments
SET status = 'cancelled'
WHERE id = 'payment-id-here';
```

---

## 🗑️ How to Delete Data

### Soft Delete (Recommended)
Instead of deleting, mark as cancelled:
```sql
UPDATE supplier_payments
SET status = 'cancelled'
WHERE id = 'payment-id-here';
```

### Hard Delete (Not Recommended)
```sql
DELETE FROM supplier_payments
WHERE id = 'payment-id-here';
```

---

## 📊 Views for Reports

### Supplier Payment Summary View
```sql
SELECT * FROM supplier_payment_summary;
```
Shows: Supplier name, total purchases, total payments, outstanding balance

### Customer Payment Summary View
```sql
SELECT * FROM customer_payment_summary;
```
Shows: Customer name, total sales, total payments, outstanding balance

---

## 🔐 Security & Access Control

### Only Owners Can View All Payments
- RLS policy ensures employees can only view payments for their branch
- Owners can view all payments across all branches

### Employee Adding Payment Shows Their Name
- When an employee (like Prodip) adds a payment, it's recorded as:
  - `added_by_name = 'Prodip'`
  - `added_by_role = 'employee'`
- Shows exactly who added the payment and when

---

## 📈 Reports You Can Generate

### 1. Daily Payment Report
```sql
SELECT payment_date, SUM(amount) as daily_total
FROM supplier_payments
WHERE status = 'verified'
GROUP BY payment_date;
```

### 2. Monthly Payment Report
```sql
SELECT DATE_TRUNC('month', payment_date) as month, SUM(amount) as monthly_total
FROM customer_payments
WHERE status = 'verified'
GROUP BY DATE_TRUNC('month', payment_date);
```

### 3. Top Suppliers by Payment
```sql
SELECT supplier_name, SUM(amount) as total
FROM supplier_payments
WHERE status = 'verified'
GROUP BY supplier_name
ORDER BY total DESC
LIMIT 10;
```

### 4. Payments Added by Each Employee
```sql
SELECT added_by_name, COUNT(*) as count, SUM(amount) as total
FROM customer_payments
WHERE added_by_role = 'employee'
GROUP BY added_by_name;
```

---

## 🚀 Setup Instructions

1. **Run the SQL file** in your Supabase database:
   - Copy all SQL from `PAYMENT_FEATURE_DATABASE.sql`
   - Go to Supabase SQL Editor
   - Paste and execute

2. **Tables will be created** automatically with:
   - All columns
   - Indexes for performance
   - Timestamps
   - Constraints

3. **Views will be created** for reports

4. **RLS policies** will be enabled for security

---

## 💡 Common Operations

### Check How Much a Customer Owes
```sql
SELECT 
  customer_name,
  (SELECT SUM(total_product_price) FROM deliveries WHERE customer_name = c.customer_name) as total_owed,
  (SELECT SUM(amount) FROM customer_payments WHERE customer_name = c.customer_name AND status = 'verified') as paid,
  ((SELECT SUM(total_product_price) FROM deliveries WHERE customer_name = c.customer_name) - 
   (SELECT SUM(amount) FROM customer_payments WHERE customer_name = c.customer_name AND status = 'verified')) as balance
FROM customers c;
```

### Check How Much You Owe a Supplier
```sql
SELECT 
  supplier_name,
  (SELECT SUM(total_price) FROM purchases WHERE supplier_name = s.supplier_name) as total_owed,
  (SELECT SUM(amount) FROM supplier_payments WHERE supplier_name = s.supplier_name AND status = 'verified') as paid,
  ((SELECT SUM(total_price) FROM purchases WHERE supplier_name = s.supplier_name) - 
   (SELECT SUM(amount) FROM supplier_payments WHERE supplier_name = s.supplier_name AND status = 'verified')) as balance
FROM suppliers s;
```

---

## 📝 Notes

- **Soft Deletes**: Use `status = 'cancelled'` instead of deleting
- **Audit Trail**: All payments show who added them and when
- **Verified Status**: Only mark as 'verified' when payment is confirmed
- **Reference Numbers**: Use for tracking checks, transfers, etc.
- **Timestamps**: Automatic - updated_at changes on edits

---

**Last Updated:** November 30, 2025
