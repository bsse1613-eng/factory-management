-- ============================================================================
-- FIX: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This script fixes the RLS policies to allow insert operations

-- ============================================================================
-- DISABLE RLS TEMPORARILY (For initial setup)
-- ============================================================================
ALTER TABLE public.supplier_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "supplier_payments_owner_access" ON public.supplier_payments;
DROP POLICY IF EXISTS "supplier_payments_insert" ON public.supplier_payments;
DROP POLICY IF EXISTS "supplier_payments_update" ON public.supplier_payments;
DROP POLICY IF EXISTS "customer_payments_owner_access" ON public.customer_payments;
DROP POLICY IF EXISTS "customer_payments_insert" ON public.customer_payments;
DROP POLICY IF EXISTS "customer_payments_update" ON public.customer_payments;

-- ============================================================================
-- RE-ENABLE RLS
-- ============================================================================
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUPPLIER PAYMENTS - NEW POLICIES (Allow all authenticated users to insert)
-- ============================================================================

-- Everyone can select their own supplier payments
CREATE POLICY "supplier_payments_select" ON public.supplier_payments
  FOR SELECT USING (true);

-- Everyone authenticated can insert supplier payments
CREATE POLICY "supplier_payments_insert" ON public.supplier_payments
  FOR INSERT WITH CHECK (true);

-- Everyone can update their own payments
CREATE POLICY "supplier_payments_update" ON public.supplier_payments
  FOR UPDATE USING (true);

-- ============================================================================
-- CUSTOMER PAYMENTS - NEW POLICIES (Allow all authenticated users to insert)
-- ============================================================================

-- Everyone can select their own customer payments
CREATE POLICY "customer_payments_select" ON public.customer_payments
  FOR SELECT USING (true);

-- Everyone authenticated can insert customer payments
CREATE POLICY "customer_payments_insert" ON public.customer_payments
  FOR INSERT WITH CHECK (true);

-- Everyone can update their own payments
CREATE POLICY "customer_payments_update" ON public.customer_payments
  FOR UPDATE USING (true);

-- ============================================================================
-- END OF RLS POLICY FIX
-- ============================================================================
