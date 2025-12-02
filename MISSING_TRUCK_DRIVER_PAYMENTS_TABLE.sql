-- ============================================================
-- TRUCK DRIVER PAYMENTS TABLE
-- This table tracks payments to drivers for deliveries and 
-- demurrage charges (waiting/unloading delays)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.truck_driver_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  
  -- References
  truck_id uuid NOT NULL,
  
  -- Driver Information
  driver_name character varying NOT NULL,
  driver_mobile character varying NOT NULL,
  
  -- Payment Details
  payment_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_type text NOT NULL DEFAULT 'regular'::text 
    CHECK (payment_type = ANY (ARRAY['regular'::text, 'demurrage'::text, 'advance'::text])),
  
  -- Additional Info
  notes text,
  
  CONSTRAINT truck_driver_payments_pkey PRIMARY KEY (id),
  CONSTRAINT truck_driver_payments_truck_id_fkey FOREIGN KEY (truck_id) REFERENCES public.trucks(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS truck_driver_payments_truck_id_idx ON public.truck_driver_payments(truck_id);
CREATE INDEX IF NOT EXISTS truck_driver_payments_payment_date_idx ON public.truck_driver_payments(payment_date);
CREATE INDEX IF NOT EXISTS truck_driver_payments_payment_type_idx ON public.truck_driver_payments(payment_type);
CREATE INDEX IF NOT EXISTS truck_driver_payments_driver_name_idx ON public.truck_driver_payments(driver_name);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.truck_driver_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow owners to view all payments
CREATE POLICY "Owners can view all driver payments" 
  ON public.truck_driver_payments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Policy: Allow employees to view all driver payments
CREATE POLICY "Employees can view all driver payments" 
  ON public.truck_driver_payments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

-- Policy: Allow owners and employees to insert payments
CREATE POLICY "Owners and employees can add driver payments" 
  ON public.truck_driver_payments 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'owner' OR role = 'employee')
    )
  );

-- Policy: Allow owners to update payments
CREATE POLICY "Owners can update driver payments" 
  ON public.truck_driver_payments 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Policy: Allow owners to delete payments
CREATE POLICY "Owners can delete driver payments" 
  ON public.truck_driver_payments 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
-- Run this SQL in your Supabase SQL Editor
-- After running, you should see:
-- - Table created: truck_driver_payments
-- - 4 indexes created
-- - 5 RLS policies created
-- 
-- Your driver payment tracking system is now ready!
-- ============================================================
