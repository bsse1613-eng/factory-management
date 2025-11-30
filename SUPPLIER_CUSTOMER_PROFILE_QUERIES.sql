-- ==========================================
-- SUPPLIER & CUSTOMER PROFILE QUERIES
-- Advanced SQL Views for Profile Pages
-- Run these in Supabase SQL Editor for better reporting
-- ==========================================

-- ==========================================
-- 1. SUPPLIER PROFILE VIEW
-- Shows complete supplier transaction summary
-- ==========================================
CREATE OR REPLACE VIEW supplier_profile_summary AS
SELECT 
  s.id,
  s.supplier_name,
  s.branch,
  s.contact_person,
  s.source_location,
  s.mobile_number,
  s.email,
  s.notes,
  s.created_at,
  COUNT(DISTINCT p.id) as total_purchases,
  COALESCE(SUM(p.total_price), 0) as total_purchase_amount,
  COALESCE(SUM(p.paid_amount), 0) as total_paid,
  COALESCE(SUM(p.due_amount), 0) as total_due,
  COUNT(DISTINCT pp.id) as payment_count,
  COALESCE(SUM(pp.amount), 0) as verified_payment_total
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_name = p.supplier_name AND s.branch = p.branch
LEFT JOIN purchase_payments pp ON p.id = pp.purchase_id
GROUP BY s.id, s.supplier_name, s.branch, s.contact_person, s.source_location, s.mobile_number, s.email, s.notes, s.created_at;

-- ==========================================
-- 2. CUSTOMER PROFILE VIEW
-- Shows complete customer transaction summary
-- ==========================================
CREATE OR REPLACE VIEW customer_profile_summary AS
SELECT 
  c.id,
  c.customer_name,
  c.branch,
  c.contact_person,
  c.customer_address,
  c.customer_mobile,
  c.email,
  c.notes,
  c.created_at,
  COUNT(DISTINCT d.id) as total_deliveries,
  COALESCE(SUM(d.total_product_price), 0) as total_sales_amount,
  COALESCE(SUM(d.product_paid_amount), 0) as total_paid,
  COALESCE(SUM(d.product_due_amount), 0) as total_due,
  COALESCE(SUM(d.driver_total_cost), 0) as total_delivery_cost,
  COUNT(DISTINCT dp.id) as payment_count,
  COALESCE(SUM(dp.amount), 0) as verified_payment_total
FROM customers c
LEFT JOIN deliveries d ON c.customer_name = d.customer_name AND c.branch = d.branch
LEFT JOIN delivery_payments dp ON d.id = dp.delivery_id
GROUP BY c.id, c.customer_name, c.branch, c.contact_person, c.customer_address, c.customer_mobile, c.email, c.notes, c.created_at;

-- ==========================================
-- 3. PURCHASE TRANSACTION DETAILS WITH PAYMENTS
-- For supplier profile page
-- ==========================================
CREATE OR REPLACE VIEW purchase_transaction_details AS
SELECT 
  p.id,
  p.supplier_name,
  p.branch,
  p.date,
  p.product_name,
  p.number_of_bags,
  p.price_per_bag,
  p.total_price,
  p.paid_amount,
  p.due_amount,
  p.notes,
  p.created_at,
  COUNT(pp.id) as payment_count,
  COALESCE(SUM(pp.amount), 0) as total_payments_recorded,
  MAX(pp.date) as last_payment_date
FROM purchases p
LEFT JOIN purchase_payments pp ON p.id = pp.purchase_id
GROUP BY p.id, p.supplier_name, p.branch, p.date, p.product_name, p.number_of_bags, 
         p.price_per_bag, p.total_price, p.paid_amount, p.due_amount, p.notes, p.created_at;

-- ==========================================
-- 4. DELIVERY TRANSACTION DETAILS WITH PAYMENTS
-- For customer profile page
-- ==========================================
CREATE OR REPLACE VIEW delivery_transaction_details AS
SELECT 
  d.id,
  d.customer_name,
  d.branch,
  d.delivery_date,
  d.driver_name,
  d.truck_number,
  d.product_name,
  d.number_of_bags,
  d.price_per_bag,
  d.total_product_price,
  d.product_paid_amount,
  d.product_due_amount,
  d.driver_payment_amount,
  d.driver_extra_cost,
  d.driver_total_cost,
  d.driver_notes,
  d.created_at,
  COUNT(dp.id) as payment_count,
  COALESCE(SUM(dp.amount), 0) as total_payments_recorded,
  MAX(dp.date) as last_payment_date
FROM deliveries d
LEFT JOIN delivery_payments dp ON d.id = dp.delivery_id
GROUP BY d.id, d.customer_name, d.branch, d.delivery_date, d.driver_name, d.truck_number,
         d.product_name, d.number_of_bags, d.price_per_bag, d.total_product_price,
         d.product_paid_amount, d.product_due_amount, d.driver_payment_amount,
         d.driver_extra_cost, d.driver_total_cost, d.driver_notes, d.created_at;

-- ==========================================
-- 5. PAYMENT TIMELINE FOR SUPPLIERS
-- Shows all payments to a supplier in chronological order
-- ==========================================
CREATE OR REPLACE VIEW supplier_payment_timeline AS
SELECT 
  s.id as supplier_id,
  s.supplier_name,
  s.branch,
  p.id as purchase_id,
  p.date as purchase_date,
  p.total_price,
  pp.id as payment_id,
  pp.date as payment_date,
  pp.amount as payment_amount,
  pp.notes as payment_notes,
  p.id IS NULL as is_orphaned
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_name = p.supplier_name AND s.branch = p.branch
LEFT JOIN purchase_payments pp ON p.id = pp.purchase_id
ORDER BY s.supplier_name, p.date DESC, pp.date DESC;

-- ==========================================
-- 6. PAYMENT TIMELINE FOR CUSTOMERS
-- Shows all payments from a customer in chronological order
-- ==========================================
CREATE OR REPLACE VIEW customer_payment_timeline AS
SELECT 
  c.id as customer_id,
  c.customer_name,
  c.branch,
  d.id as delivery_id,
  d.delivery_date,
  d.total_product_price,
  dp.id as payment_id,
  dp.date as payment_date,
  dp.amount as payment_amount,
  dp.notes as payment_notes,
  d.id IS NULL as is_orphaned
FROM customers c
LEFT JOIN deliveries d ON c.customer_name = d.customer_name AND c.branch = d.branch
LEFT JOIN delivery_payments dp ON d.id = dp.delivery_id
ORDER BY c.customer_name, d.delivery_date DESC, dp.date DESC;

-- ==========================================
-- 7. OUTSTANDING DUES REPORT
-- All suppliers with unpaid amounts
-- ==========================================
CREATE OR REPLACE VIEW outstanding_supplier_dues AS
SELECT 
  s.id,
  s.supplier_name,
  s.branch,
  s.mobile_number,
  COUNT(p.id) as pending_transactions,
  COALESCE(SUM(p.due_amount), 0) as total_due
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_name = p.supplier_name AND s.branch = p.branch
WHERE p.due_amount > 0
GROUP BY s.id, s.supplier_name, s.branch, s.mobile_number
ORDER BY total_due DESC;

-- ==========================================
-- 8. OUTSTANDING RECEIVABLES REPORT
-- All customers with unpaid amounts
-- ==========================================
CREATE OR REPLACE VIEW outstanding_customer_receivables AS
SELECT 
  c.id,
  c.customer_name,
  c.branch,
  c.customer_mobile,
  COUNT(d.id) as pending_deliveries,
  COALESCE(SUM(d.product_due_amount), 0) as total_due
FROM customers c
LEFT JOIN deliveries d ON c.customer_name = d.customer_name AND c.branch = d.branch
WHERE d.product_due_amount > 0
GROUP BY c.id, c.customer_name, c.branch, c.customer_mobile
ORDER BY total_due DESC;

-- ==========================================
-- SAMPLE QUERIES FOR PROFILE PAGES
-- ==========================================

-- Get supplier profile summary
-- SELECT * FROM supplier_profile_summary WHERE id = 'supplier-uuid-here';

-- Get all purchases for a supplier with payment info
-- SELECT * FROM purchase_transaction_details WHERE supplier_name = 'Rahim Traders' ORDER BY date DESC;

-- Get payment timeline for a supplier
-- SELECT * FROM supplier_payment_timeline WHERE supplier_id = 'supplier-uuid-here' ORDER BY payment_date DESC;

-- Get customer profile summary
-- SELECT * FROM customer_profile_summary WHERE id = 'customer-uuid-here';

-- Get all deliveries for a customer with payment info
-- SELECT * FROM delivery_transaction_details WHERE customer_name = 'Jamuna Mills' ORDER BY delivery_date DESC;

-- Get payment timeline for a customer
-- SELECT * FROM customer_payment_timeline WHERE customer_id = 'customer-uuid-here' ORDER BY payment_date DESC;

-- Get suppliers with outstanding dues
-- SELECT * FROM outstanding_supplier_dues WHERE total_due > 0 ORDER BY total_due DESC;

-- Get customers with outstanding receivables
-- SELECT * FROM outstanding_customer_receivables WHERE total_due > 0 ORDER BY total_due DESC;

-- ==========================================
-- END OF PROFILE QUERY SETUP
-- ==========================================
