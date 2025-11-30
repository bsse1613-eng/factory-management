-- ============================================================================
-- ADDITIONAL SQL TO RUN IN YOUR SUPABASE SQL EDITOR
-- ============================================================================
-- Add these tables to your existing schema
-- Run this script AFTER your existing tables are created
-- ============================================================================

-- ============================================================================
-- TABLE 1: SUPPLIER PAYMENTS
-- ============================================================================
-- Stores all payments made to suppliers (for owner to track money added)

CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  
  -- Supplier Information
  supplier_id uuid,
  supplier_name text NOT NULL,
  
  -- Payment Details
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  notes text,
  
  -- Tracking Information
  added_by uuid,
  added_by_name text,
  added_by_role text, -- 'owner' or 'employee'
  
  -- Status
  status text DEFAULT 'verified', -- 'pending', 'verified', 'cancelled'
  reference_number text,
  
  -- Audit Trail
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_by uuid,
  
  CONSTRAINT supplier_payments_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_payments_positive_amount CHECK (amount > 0),
  CONSTRAINT supplier_payments_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE 2: CUSTOMER PAYMENTS
-- ============================================================================
-- Stores all payments received from customers (for owner to track money added)

CREATE TABLE IF NOT EXISTS public.customer_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  
  -- Customer Information
  customer_id uuid,
  customer_name text NOT NULL,
  
  -- Payment Details
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  notes text,
  
  -- Tracking Information
  added_by uuid,
  added_by_name text,
  added_by_role text, -- 'owner' or 'employee'
  
  -- Status
  status text DEFAULT 'verified', -- 'pending', 'verified', 'cancelled'
  reference_number text,
  
  -- Audit Trail
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_by uuid,
  
  CONSTRAINT customer_payments_pkey PRIMARY KEY (id),
  CONSTRAINT customer_payments_positive_amount CHECK (amount > 0),
  CONSTRAINT customer_payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Supplier Payments Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_payments_created_at ON public.supplier_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON public.supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_name ON public.supplier_payments(supplier_name);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_payment_date ON public.supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_added_by ON public.supplier_payments(added_by);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_status ON public.supplier_payments(status);

-- Customer Payments Indexes
CREATE INDEX IF NOT EXISTS idx_customer_payments_created_at ON public.customer_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON public.customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_name ON public.customer_payments(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_date ON public.customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_customer_payments_added_by ON public.customer_payments(added_by);
CREATE INDEX IF NOT EXISTS idx_customer_payments_status ON public.customer_payments(status);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- ============================================================================
-- VIEW 1: Supplier Payment Summary
-- ============================================================================
CREATE OR REPLACE VIEW public.supplier_payment_summary AS
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
FROM public.suppliers s
LEFT JOIN public.purchases p ON s.supplier_name = p.supplier_name
LEFT JOIN public.supplier_payments sp ON s.supplier_name = sp.supplier_name
  AND sp.status = 'verified'
GROUP BY s.id, s.supplier_name, s.source_location, s.branch;

-- ============================================================================
-- VIEW 2: Customer Payment Summary
-- ============================================================================
CREATE OR REPLACE VIEW public.customer_payment_summary AS
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
FROM public.customers c
LEFT JOIN public.deliveries d ON c.customer_name = d.customer_name
LEFT JOIN public.customer_payments cp ON c.customer_name = cp.customer_name
  AND cp.status = 'verified'
GROUP BY c.id, c.customer_name, c.customer_address, c.branch;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Automatically update updated_at timestamp for supplier_payments
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_supplier_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS supplier_payments_timestamp_trigger ON public.supplier_payments;

CREATE TRIGGER supplier_payments_timestamp_trigger
BEFORE UPDATE ON public.supplier_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_supplier_payments_timestamp();

-- ============================================================================
-- TRIGGER 2: Automatically update updated_at timestamp for customer_payments
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_customer_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_payments_timestamp_trigger ON public.customer_payments;

CREATE TRIGGER customer_payments_timestamp_trigger
BEFORE UPDATE ON public.customer_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_payments_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUPPLIER PAYMENTS RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "supplier_payments_owner_access" ON public.supplier_payments;
DROP POLICY IF EXISTS "supplier_payments_insert" ON public.supplier_payments;
DROP POLICY IF EXISTS "supplier_payments_update" ON public.supplier_payments;

-- Only owners can select all supplier payments
CREATE POLICY "supplier_payments_owner_access" ON public.supplier_payments
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'owner'
  );

-- Anyone authenticated can insert
CREATE POLICY "supplier_payments_insert" ON public.supplier_payments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Only owners can update
CREATE POLICY "supplier_payments_update" ON public.supplier_payments
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'owner'
  );

-- ============================================================================
-- CUSTOMER PAYMENTS RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "customer_payments_owner_access" ON public.customer_payments;
DROP POLICY IF EXISTS "customer_payments_insert" ON public.customer_payments;
DROP POLICY IF EXISTS "customer_payments_update" ON public.customer_payments;

-- Only owners can select all customer payments
CREATE POLICY "customer_payments_owner_access" ON public.customer_payments
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'owner'
  );

-- Anyone authenticated can insert
CREATE POLICY "customer_payments_insert" ON public.customer_payments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Only owners can update
CREATE POLICY "customer_payments_update" ON public.customer_payments
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'owner'
  );

-- ============================================================================
-- USEFUL QUERIES FOR DATA RETRIEVAL
-- ============================================================================

-- ============================================================================
-- QUERY 1: Get all supplier payments for a specific supplier
-- ============================================================================
-- SELECT 
--   sp.id,
--   sp.supplier_name,
--   sp.amount,
--   sp.payment_date,
--   sp.payment_method,
--   sp.notes,
--   sp.added_by_name,
--   sp.added_by_role,
--   sp.status,
--   sp.created_at
-- FROM public.supplier_payments sp
-- WHERE sp.supplier_name = 'Supplier Name Here'
-- ORDER BY sp.payment_date DESC;

-- ============================================================================
-- QUERY 2: Get total payments made to a supplier
-- ============================================================================
-- SELECT 
--   sp.supplier_name,
--   COUNT(*) as total_transactions,
--   SUM(sp.amount) as total_paid,
--   AVG(sp.amount) as average_payment,
--   MIN(sp.payment_date) as first_payment_date,
--   MAX(sp.payment_date) as last_payment_date
-- FROM public.supplier_payments sp
-- WHERE sp.supplier_name = 'Supplier Name Here'
--   AND sp.status = 'verified'
-- GROUP BY sp.supplier_name;

-- ============================================================================
-- QUERY 3: Get all customer payments for a specific customer
-- ============================================================================
-- SELECT 
--   cp.id,
--   cp.customer_name,
--   cp.amount,
--   cp.payment_date,
--   cp.payment_method,
--   cp.notes,
--   cp.added_by_name,
--   cp.added_by_role,
--   cp.status,
--   cp.created_at
-- FROM public.customer_payments cp
-- WHERE cp.customer_name = 'Customer Name Here'
-- ORDER BY cp.payment_date DESC;

-- ============================================================================
-- QUERY 4: Get supplier balance (Total Purchases - Total Payments)
-- ============================================================================
-- SELECT 
--   s.supplier_name,
--   COALESCE(SUM(p.total_price), 0) as total_purchased,
--   COALESCE(SUM(sp.amount), 0) as total_paid,
--   (COALESCE(SUM(p.total_price), 0) - COALESCE(SUM(sp.amount), 0)) as balance_due
-- FROM public.suppliers s
-- LEFT JOIN public.purchases p ON s.supplier_name = p.supplier_name
-- LEFT JOIN public.supplier_payments sp ON s.supplier_name = sp.supplier_name
--   AND sp.status = 'verified'
-- GROUP BY s.supplier_name
-- ORDER BY balance_due DESC;

-- ============================================================================
-- QUERY 5: Get customer balance (Total Sales - Total Payments)
-- ============================================================================
-- SELECT 
--   c.customer_name,
--   COALESCE(SUM(d.total_product_price), 0) as total_sales,
--   COALESCE(SUM(cp.amount), 0) as total_paid,
--   (COALESCE(SUM(d.total_product_price), 0) - COALESCE(SUM(cp.amount), 0)) as balance_due
-- FROM public.customers c
-- LEFT JOIN public.deliveries d ON c.customer_name = d.customer_name
-- LEFT JOIN public.customer_payments cp ON c.customer_name = cp.customer_name
--   AND cp.status = 'verified'
-- GROUP BY c.customer_name
-- ORDER BY balance_due DESC;

-- ============================================================================
-- INSERT TEST DATA EXAMPLES
-- ============================================================================

-- ============================================================================
-- INSERT EXAMPLE 1: Add a supplier payment
-- ============================================================================
-- INSERT INTO public.supplier_payments (
--   supplier_name,
--   amount,
--   payment_date,
--   payment_method,
--   notes,
--   added_by_name,
--   added_by_role,
--   reference_number
-- ) VALUES (
--   'Prottoy Traders',
--   50000,
--   '2025-11-30',
--   'Bank Transfer',
--   'Payment for rice purchase of 100 bags',
--   'Owner Name',
--   'owner',
--   'BT-20251130-001'
-- );

-- ============================================================================
-- INSERT EXAMPLE 2: Add a customer payment
-- ============================================================================
-- INSERT INTO public.customer_payments (
--   customer_name,
--   amount,
--   payment_date,
--   payment_method,
--   notes,
--   added_by_name,
--   added_by_role,
--   reference_number
-- ) VALUES (
--   'Jamuna Mills',
--   75000,
--   '2025-11-30',
--   'Cash',
--   'Payment received in cash',
--   'Prodip',
--   'employee',
--   'CASH-20251130-001'
-- );

-- ============================================================================
-- END OF ADDITIONAL SQL SCHEMA
-- ============================================================================
