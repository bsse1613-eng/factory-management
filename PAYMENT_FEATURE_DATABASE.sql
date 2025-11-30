-- ============================================================================
-- ALANKAR AGRO - Payment Management Database Schema
-- ============================================================================
-- This file contains all SQL queries for the payment tracking feature
-- in Supplier and Customer profiles
-- ============================================================================

-- ============================================================================
-- TABLE 1: SUPPLIER PAYMENTS
-- ============================================================================
-- Stores all payments made to suppliers (for owner to track money added)

CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Supplier Information
  supplier_id UUID,
  supplier_name VARCHAR(255) NOT NULL,
  
  -- Payment Details
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(100),
  notes TEXT,
  
  -- Tracking Information
  added_by UUID,
  added_by_name VARCHAR(255),
  added_by_role VARCHAR(50), -- 'owner' or 'employee'
  
  -- Status
  status VARCHAR(50) DEFAULT 'verified', -- 'pending', 'verified', 'cancelled'
  reference_number VARCHAR(100),
  
  -- Audit Trail
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
    CONSTRAINT positive_amount CHECK (amount > 0),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE 2: CUSTOMER PAYMENTS
-- ============================================================================
-- Stores all payments received from customers (for owner to track money added)

CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Customer Information
  customer_id UUID,
  customer_name VARCHAR(255) NOT NULL,
  
  -- Payment Details
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(100),
  notes TEXT,
  
  -- Tracking Information
  added_by UUID,
  added_by_name VARCHAR(255),
  added_by_role VARCHAR(50), -- 'owner' or 'employee'
  
  -- Status
  status VARCHAR(50) DEFAULT 'verified', -- 'pending', 'verified', 'cancelled'
  reference_number VARCHAR(100),
  
  -- Audit Trail
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
    CONSTRAINT positive_amount CHECK (amount > 0),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

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

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- ============================================================================
-- QUERY 1: Get all supplier payments for a specific supplier
-- ============================================================================
SELECT 
  sp.id,
  sp.supplier_name,
  sp.amount,
  sp.payment_date,
  sp.payment_method,
  sp.notes,
  sp.added_by_name,
  sp.added_by_role,
  sp.status,
  sp.created_at
FROM supplier_payments sp
WHERE sp.supplier_name = 'Supplier Name Here'
ORDER BY sp.payment_date DESC;

-- ============================================================================
-- QUERY 2: Get total payments made to a supplier
-- ============================================================================
SELECT 
  sp.supplier_name,
  COUNT(*) as total_transactions,
  SUM(sp.amount) as total_paid,
  AVG(sp.amount) as average_payment,
  MIN(sp.payment_date) as first_payment_date,
  MAX(sp.payment_date) as last_payment_date
FROM supplier_payments sp
WHERE sp.supplier_name = 'Supplier Name Here'
  AND sp.status = 'verified'
GROUP BY sp.supplier_name;

-- ============================================================================
-- QUERY 3: Get all customer payments for a specific customer
-- ============================================================================
SELECT 
  cp.id,
  cp.customer_name,
  cp.amount,
  cp.payment_date,
  cp.payment_method,
  cp.notes,
  cp.added_by_name,
  cp.added_by_role,
  cp.status,
  cp.created_at
FROM customer_payments cp
WHERE cp.customer_name = 'Customer Name Here'
ORDER BY cp.payment_date DESC;

-- ============================================================================
-- QUERY 4: Get total payments received from a customer
-- ============================================================================
SELECT 
  cp.customer_name,
  COUNT(*) as total_transactions,
  SUM(cp.amount) as total_received,
  AVG(cp.amount) as average_payment,
  MIN(cp.payment_date) as first_payment_date,
  MAX(cp.payment_date) as last_payment_date
FROM customer_payments cp
WHERE cp.customer_name = 'Customer Name Here'
  AND cp.status = 'verified'
GROUP BY cp.customer_name;

-- ============================================================================
-- QUERY 5: Get payments added by specific user
-- ============================================================================
SELECT 
  'Supplier' as payment_type,
  sp.supplier_name as party_name,
  sp.amount,
  sp.payment_date,
  sp.added_by_role,
  sp.created_at
FROM supplier_payments sp
WHERE sp.added_by_name = 'User Name Here'
UNION ALL
SELECT 
  'Customer' as payment_type,
  cp.customer_name as party_name,
  cp.amount,
  cp.payment_date,
  cp.added_by_role,
  cp.created_at
FROM customer_payments cp
WHERE cp.added_by_name = 'User Name Here'
ORDER BY created_at DESC;

-- ============================================================================
-- QUERY 6: Get daily payment summary
-- ============================================================================
SELECT 
  sp.payment_date,
  COUNT(sp.id) as supplier_transactions,
  SUM(sp.amount) as supplier_total,
  COUNT(cp.id) as customer_transactions,
  SUM(cp.amount) as customer_total,
  (SUM(sp.amount) + SUM(cp.amount)) as grand_total
FROM supplier_payments sp
FULL OUTER JOIN customer_payments cp ON sp.payment_date = cp.payment_date
WHERE sp.payment_date >= '2025-01-01'
  AND sp.status = 'verified'
  AND cp.status = 'verified'
GROUP BY sp.payment_date
ORDER BY sp.payment_date DESC;

-- ============================================================================
-- QUERY 7: Get monthly payment summary
-- ============================================================================
SELECT 
  DATE_TRUNC('month', sp.payment_date)::DATE as month,
  COUNT(sp.id) as supplier_transactions,
  SUM(sp.amount) as supplier_total,
  COUNT(cp.id) as customer_transactions,
  SUM(cp.amount) as customer_total
FROM supplier_payments sp
FULL OUTER JOIN customer_payments cp 
  ON DATE_TRUNC('month', sp.payment_date) = DATE_TRUNC('month', cp.payment_date)
WHERE sp.status = 'verified'
  AND cp.status = 'verified'
GROUP BY DATE_TRUNC('month', sp.payment_date)
ORDER BY month DESC;

-- ============================================================================
-- QUERY 8: Get payments by role (Owner vs Employee)
-- ============================================================================
SELECT 
  sp.added_by_role,
  COUNT(sp.id) as supplier_payments,
  SUM(sp.amount) as supplier_total,
  COUNT(cp.id) as customer_payments,
  SUM(cp.amount) as customer_total
FROM supplier_payments sp
FULL OUTER JOIN customer_payments cp ON sp.added_by_role = cp.added_by_role
WHERE sp.status = 'verified'
  AND cp.status = 'verified'
GROUP BY sp.added_by_role
ORDER BY sp.added_by_role;

-- ============================================================================
-- QUERY 9: Get pending payments that need verification
-- ============================================================================
SELECT 
  'Supplier' as type,
  sp.supplier_name as party_name,
  sp.amount,
  sp.payment_date,
  sp.added_by_name,
  sp.added_by_role,
  sp.status,
  sp.created_at
FROM supplier_payments sp
WHERE sp.status = 'pending'
UNION ALL
SELECT 
  'Customer' as type,
  cp.customer_name as party_name,
  cp.amount,
  cp.payment_date,
  cp.added_by_name,
  cp.added_by_role,
  cp.status,
  cp.created_at
FROM customer_payments cp
WHERE cp.status = 'pending'
ORDER BY created_at ASC;

-- ============================================================================
-- QUERY 10: Get supplier balance (Total Purchases - Total Payments)
-- ============================================================================
SELECT 
  s.supplier_name,
  COALESCE(SUM(p.total_price), 0) as total_purchased,
  COALESCE(SUM(sp.amount), 0) as total_paid,
  (COALESCE(SUM(p.total_price), 0) - COALESCE(SUM(sp.amount), 0)) as balance_due
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_name = p.supplier_name
LEFT JOIN supplier_payments sp ON s.supplier_name = sp.supplier_name
  AND sp.status = 'verified'
GROUP BY s.supplier_name
ORDER BY balance_due DESC;

-- ============================================================================
-- QUERY 11: Get customer balance (Total Sales - Total Payments)
-- ============================================================================
SELECT 
  c.customer_name,
  COALESCE(SUM(d.total_product_price), 0) as total_sales,
  COALESCE(SUM(cp.amount), 0) as total_paid,
  (COALESCE(SUM(d.total_product_price), 0) - COALESCE(SUM(cp.amount), 0)) as balance_due
FROM customers c
LEFT JOIN deliveries d ON c.customer_name = d.customer_name
LEFT JOIN customer_payments cp ON c.customer_name = cp.customer_name
  AND cp.status = 'verified'
GROUP BY c.customer_name
ORDER BY balance_due DESC;

-- ============================================================================
-- QUERY 12: Get top suppliers by payment volume
-- ============================================================================
SELECT 
  sp.supplier_name,
  COUNT(sp.id) as payment_count,
  SUM(sp.amount) as total_amount,
  AVG(sp.amount) as average_payment,
  MAX(sp.payment_date) as last_payment
FROM supplier_payments sp
WHERE sp.status = 'verified'
GROUP BY sp.supplier_name
ORDER BY total_amount DESC
LIMIT 10;

-- ============================================================================
-- QUERY 13: Get top customers by payment volume
-- ============================================================================
SELECT 
  cp.customer_name,
  COUNT(cp.id) as payment_count,
  SUM(cp.amount) as total_amount,
  AVG(cp.amount) as average_payment,
  MAX(cp.payment_date) as last_payment
FROM customer_payments cp
WHERE cp.status = 'verified'
GROUP BY cp.customer_name
ORDER BY total_amount DESC
LIMIT 10;

-- ============================================================================
-- QUERY 14: Get payment audit trail for a specific supplier payment
-- ============================================================================
SELECT 
  sp.id,
  sp.supplier_name,
  sp.amount,
  sp.payment_date,
  sp.added_by_name,
  sp.added_by_role,
  sp.status,
  sp.created_at,
  sp.updated_at,
  sp.reference_number
FROM supplier_payments sp
WHERE sp.id = 'payment_id_here'
ORDER BY sp.created_at DESC;

-- ============================================================================
-- QUERY 15: Get all payments for financial report (Date Range)
-- ============================================================================
SELECT 
  sp.payment_date,
  sp.supplier_name as party_name,
  'Supplier' as type,
  sp.amount,
  sp.payment_method,
  sp.added_by_name,
  sp.added_by_role
FROM supplier_payments sp
WHERE sp.payment_date BETWEEN '2025-01-01' AND '2025-12-31'
  AND sp.status = 'verified'
UNION ALL
SELECT 
  cp.payment_date,
  cp.customer_name as party_name,
  'Customer' as type,
  cp.amount,
  cp.payment_method,
  cp.added_by_name,
  cp.added_by_role
FROM customer_payments cp
WHERE cp.payment_date BETWEEN '2025-01-01' AND '2025-12-31'
  AND cp.status = 'verified'
ORDER BY payment_date DESC;

-- ============================================================================
-- INSERT EXAMPLES
-- ============================================================================

-- ============================================================================
-- INSERT EXAMPLE 1: Add a supplier payment (Owner adding payment)
-- ============================================================================
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
  'Prottoy Traders',
  50000,
  '2025-11-30',
  'Bank Transfer',
  'Payment for rice purchase of 100 bags',
  'Owner Name',
  'owner',
  'BT-20251130-001'
);

-- ============================================================================
-- INSERT EXAMPLE 2: Add a customer payment (Employee adding payment)
-- ============================================================================
INSERT INTO customer_payments (
  customer_name,
  amount,
  payment_date,
  payment_method,
  notes,
  added_by_name,
  added_by_role,
  reference_number
) VALUES (
  'Jamuna Mills',
  75000,
  '2025-11-30',
  'Cash',
  'Payment received in cash',
  'Prodip',
  'employee',
  'CASH-20251130-001'
);

-- ============================================================================
-- UPDATE EXAMPLES
-- ============================================================================

-- ============================================================================
-- UPDATE EXAMPLE 1: Mark payment as verified
-- ============================================================================
UPDATE supplier_payments
SET status = 'verified', updated_at = NOW()
WHERE id = 'payment_id_here';

-- ============================================================================
-- UPDATE EXAMPLE 2: Update payment notes
-- ============================================================================
UPDATE customer_payments
SET notes = 'Updated notes here', updated_at = NOW()
WHERE id = 'payment_id_here';

-- ============================================================================
-- DELETE EXAMPLES
-- ============================================================================

-- ============================================================================
-- DELETE EXAMPLE 1: Cancel a supplier payment (set to cancelled instead)
-- ============================================================================
UPDATE supplier_payments
SET status = 'cancelled', updated_at = NOW()
WHERE id = 'payment_id_here';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUPPLIER PAYMENTS RLS POLICY
-- ============================================================================
-- Only owners can view all supplier payments
-- Employees can only view payments for their branch

CREATE POLICY "supplier_payments_owner_access" ON supplier_payments
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'owner'
  );

-- ============================================================================
-- CUSTOMER PAYMENTS RLS POLICY
-- ============================================================================
-- Only owners can view all customer payments
-- Employees can only view payments for their branch

CREATE POLICY "customer_payments_owner_access" ON customer_payments
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'owner'
  );

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- ============================================================================
-- VIEW 1: Supplier Payment Summary
-- ============================================================================
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

-- ============================================================================
-- VIEW 2: Customer Payment Summary
-- ============================================================================
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

-- ============================================================================
-- TRIGGERS (Optional - for automatic updates)
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Automatically update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_supplier_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supplier_payments_timestamp_trigger
BEFORE UPDATE ON supplier_payments
FOR EACH ROW
EXECUTE FUNCTION update_supplier_payments_timestamp();

CREATE OR REPLACE FUNCTION update_customer_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_payments_timestamp_trigger
BEFORE UPDATE ON customer_payments
FOR EACH ROW
EXECUTE FUNCTION update_customer_payments_timestamp();

-- ============================================================================
-- END OF PAYMENT FEATURE DATABASE SCHEMA
-- ============================================================================
