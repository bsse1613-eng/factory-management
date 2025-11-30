-- =====================================================
-- FLEET MANAGEMENT - TRUCKS TABLE
-- =====================================================
-- Add this to your Supabase database
-- Date: November 30, 2025

-- Create trucks table
CREATE TABLE IF NOT EXISTS public.trucks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  truck_number VARCHAR(20) NOT NULL UNIQUE,
  driver_name VARCHAR(100) NOT NULL,
  driver_license VARCHAR(50) NOT NULL UNIQUE,
  driver_mobile VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Truck',
  capacity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_trucks_driver_name ON public.trucks(driver_name);
CREATE INDEX idx_trucks_truck_number ON public.trucks(truck_number);
CREATE INDEX idx_trucks_created_at ON public.trucks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all users to view trucks
CREATE POLICY "trucks_select_all"
  ON public.trucks
  FOR SELECT
  USING (true);

-- RLS Policy: Allow only owners to insert trucks
CREATE POLICY "trucks_insert_owner_only"
  ON public.trucks
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

-- RLS Policy: Allow only owners to update trucks
CREATE POLICY "trucks_update_owner_only"
  ON public.trucks
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

-- RLS Policy: Allow only owners to delete trucks
CREATE POLICY "trucks_delete_owner_only"
  ON public.trucks
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trucks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trucks_updated_at_trigger
BEFORE UPDATE ON public.trucks
FOR EACH ROW
EXECUTE FUNCTION update_trucks_timestamp();

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT ON public.trucks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trucks TO authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment below to add sample trucks

/*
INSERT INTO public.trucks (truck_number, driver_name, driver_license, driver_mobile, vehicle_type, capacity, notes)
VALUES
  ('DH-12-A-1234', 'Mohammed Rahman', 'LIC-2024-001', '01712345678', 'Truck', 500, 'Well maintained, AC working'),
  ('DH-12-B-5678', 'Ahmed Khan', 'LIC-2024-002', '01798765432', 'Lorry', 300, 'Suitable for short routes'),
  ('DH-12-C-9012', 'Karim Mia', 'LIC-2024-003', '01654321098', 'Van', 200, 'Good condition');
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup:

-- Check if trucks table was created
-- SELECT * FROM information_schema.tables WHERE table_name = 'trucks';

-- Check row count
-- SELECT COUNT(*) as truck_count FROM public.trucks;

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'trucks';

-- =====================================================
-- END OF TRUCKS TABLE SETUP
-- =====================================================
