-- Create truck_driver_payments table
CREATE TABLE IF NOT EXISTS truck_driver_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_mobile TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('regular', 'demurrage', 'advance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_truck_driver_payments_truck_id ON truck_driver_payments(truck_id);
CREATE INDEX IF NOT EXISTS idx_truck_driver_payments_payment_date ON truck_driver_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_truck_driver_payments_payment_type ON truck_driver_payments(payment_type);

-- Add RLS policies
ALTER TABLE truck_driver_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view all records
CREATE POLICY truck_driver_payments_owner_select ON truck_driver_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Policy: Owners can insert records
CREATE POLICY truck_driver_payments_owner_insert ON truck_driver_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Policy: Owners can update records
CREATE POLICY truck_driver_payments_owner_update ON truck_driver_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Policy: Owners can delete records
CREATE POLICY truck_driver_payments_owner_delete ON truck_driver_payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Policy: Employees can view records for their own branch (via truck)
CREATE POLICY truck_driver_payments_employee_select ON truck_driver_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'employee'
    )
  );

-- Timestamp update trigger
CREATE OR REPLACE FUNCTION update_truck_driver_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER truck_driver_payments_updated_at_trigger
BEFORE UPDATE ON truck_driver_payments
FOR EACH ROW
EXECUTE FUNCTION update_truck_driver_payments_updated_at();
