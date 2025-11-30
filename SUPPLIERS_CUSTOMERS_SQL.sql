-- ==========================================
-- Suppliers & Customers Master Tables
-- Supabase SQL Setup for Suppliers & Customers Feature
-- Add this to your Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. SUPPLIERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  branch TEXT NOT NULL CHECK (branch IN ('Bogura', 'Santahar')),
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  source_location TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT,
  notes TEXT
);

-- Create index on branch for faster queries
CREATE INDEX IF NOT EXISTS idx_suppliers_branch ON suppliers(branch);

-- Create index on supplier_name for search
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);

-- Set up RLS for suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view suppliers
CREATE POLICY "Authenticated users can select suppliers" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert suppliers
CREATE POLICY "Authenticated users can insert suppliers" ON suppliers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update suppliers
CREATE POLICY "Authenticated users can update suppliers" ON suppliers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete suppliers
CREATE POLICY "Authenticated users can delete suppliers" ON suppliers
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- 2. CUSTOMERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  branch TEXT NOT NULL CHECK (branch IN ('Bogura', 'Santahar')),
  customer_name TEXT NOT NULL,
  contact_person TEXT,
  customer_address TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  email TEXT,
  notes TEXT
);

-- Create index on branch for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch);

-- Create index on customer_name for search
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);

-- Set up RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view customers
CREATE POLICY "Authenticated users can select customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert customers
CREATE POLICY "Authenticated users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update customers
CREATE POLICY "Authenticated users can update customers" ON customers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete customers
CREATE POLICY "Authenticated users can delete customers" ON customers
  FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- 3. SAMPLE DATA (Optional - for testing)
-- ==========================================
-- Insert sample suppliers
INSERT INTO suppliers (branch, supplier_name, contact_person, source_location, mobile_number, email, notes)
VALUES 
  ('Bogura', 'Rahim Traders', 'Rahim Ahmed', 'Bogura Market', '01712345678', 'rahim@traders.com', 'Primary supplier for rice'),
  ('Santahar', 'Karim Enterprise', 'Karim Hassan', 'Santahar Area', '01798765432', 'karim@enterprise.com', 'Regular supplier')
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (branch, customer_name, contact_person, customer_address, customer_mobile, email, notes)
VALUES 
  ('Bogura', 'Jamuna Mills', 'Jamuna Akhter', 'Bogura City Center', '01654321987', 'jamuna@mills.com', 'Wholesale buyer'),
  ('Santahar', 'Local Wholesaler', 'Rashid Khan', 'Santahar Main Road', '01876543210', 'rashid@wholesale.com', 'Regular customer')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. HELPFUL QUERIES FOR MANAGEMENT
-- ==========================================

-- View all suppliers in a branch
-- SELECT * FROM suppliers WHERE branch = 'Bogura' ORDER BY supplier_name;

-- View all customers in a branch
-- SELECT * FROM customers WHERE branch = 'Santahar' ORDER BY customer_name;

-- Search suppliers by name
-- SELECT * FROM suppliers WHERE supplier_name ILIKE '%rahim%' ORDER BY created_at DESC;

-- Search customers by name
-- SELECT * FROM customers WHERE customer_name ILIKE '%jamuna%' ORDER BY created_at DESC;

-- Get supplier purchase statistics (join with purchases table)
-- SELECT 
--   s.id,
--   s.supplier_name,
--   s.branch,
--   COUNT(p.id) as total_purchases,
--   COALESCE(SUM(p.total_price), 0) as total_amount,
--   COALESCE(SUM(p.paid_amount), 0) as paid_amount,
--   COALESCE(SUM(p.due_amount), 0) as outstanding_due
-- FROM suppliers s
-- LEFT JOIN purchases p ON s.supplier_name = p.supplier_name AND s.branch = p.branch
-- GROUP BY s.id, s.supplier_name, s.branch
-- ORDER BY s.supplier_name;

-- Get customer delivery statistics (join with deliveries table)
-- SELECT 
--   c.id,
--   c.customer_name,
--   c.branch,
--   COUNT(d.id) as total_deliveries,
--   COALESCE(SUM(d.total_product_price), 0) as total_sales,
--   COALESCE(SUM(d.product_paid_amount), 0) as paid_amount,
--   COALESCE(SUM(d.product_due_amount), 0) as outstanding_due
-- FROM customers c
-- LEFT JOIN deliveries d ON c.customer_name = d.customer_name AND c.branch = d.branch
-- GROUP BY c.id, c.customer_name, c.branch
-- ORDER BY c.customer_name;

-- ==========================================
-- 5. MAINTENANCE QUERIES (Optional)
-- ==========================================

-- Update supplier's contact info
-- UPDATE suppliers SET contact_person = 'New Name', mobile_number = '01700000000' WHERE id = 'supplier-uuid-here';

-- Update customer's address
-- UPDATE customers SET customer_address = 'New Address' WHERE id = 'customer-uuid-here';

-- Delete a supplier (all related purchases will be preserved)
-- DELETE FROM suppliers WHERE id = 'supplier-uuid-here';

-- Delete a customer (all related deliveries will be preserved)
-- DELETE FROM customers WHERE id = 'customer-uuid-here';

-- ==========================================
-- END OF SCRIPT
-- ==========================================
