-- ==========================================
-- Factory Business Management System Schema
-- Supabase SQL Setup
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Profiles Table (User Management)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'employee')),
  branch TEXT CHECK (branch IN ('Bogura', 'Santahar', null)),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Owner can view all profiles
CREATE POLICY "Owner can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. Purchases Table (Supplier Orders)
-- ==========================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date DATE NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Bogura', 'Santahar')),
  supplier_name TEXT NOT NULL,
  source_location TEXT,
  number_of_bags INTEGER NOT NULL,
  price_per_bag DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  due_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Owner sees all, Employees see their branch
CREATE POLICY "Purchase visibility" ON purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'owner' OR branch = purchases.branch)
    )
  );

-- Policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert purchases" ON purchases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their branch's purchases
CREATE POLICY "Can update own branch purchases" ON purchases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'owner' OR branch = purchases.branch)
    )
  );

-- ==========================================
-- 3. Purchase Payments Table
-- ==========================================
CREATE TABLE IF NOT EXISTS purchase_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for purchase_payments
ALTER TABLE purchase_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see payments for purchases they can access
CREATE POLICY "View purchase payments" ON purchase_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_payments.purchase_id
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND (role = 'owner' OR branch = purchases.branch)
      )
    )
  );

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert purchase payments" ON purchase_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 4. Deliveries Table (Sales Orders)
-- ==========================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivery_date DATE NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Bogura', 'Santahar')),
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  customer_mobile TEXT,
  driver_name TEXT,
  truck_number TEXT,
  number_of_bags INTEGER NOT NULL,
  price_per_bag DECIMAL(10, 2) NOT NULL,
  total_product_price DECIMAL(12, 2) NOT NULL,
  product_paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  product_due_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  driver_payment_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  driver_extra_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  driver_total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  driver_notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for deliveries
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Owner sees all, Employees see their branch
CREATE POLICY "Delivery visibility" ON deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'owner' OR branch = deliveries.branch)
    )
  );

-- Policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert deliveries" ON deliveries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their branch's deliveries
CREATE POLICY "Can update own branch deliveries" ON deliveries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'owner' OR branch = deliveries.branch)
    )
  );

-- ==========================================
-- 5. Delivery Payments Table
-- ==========================================
CREATE TABLE IF NOT EXISTS delivery_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for delivery_payments
ALTER TABLE delivery_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see payments for deliveries they can access
CREATE POLICY "View delivery payments" ON delivery_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = delivery_payments.delivery_id
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND (role = 'owner' OR branch = deliveries.branch)
      )
    )
  );

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert delivery payments" ON delivery_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 6. Expenses Table
-- ==========================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date DATE NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Bogura', 'Santahar')),
  category TEXT NOT NULL CHECK (category IN ('Material', 'Labor')),
  item_name TEXT,
  quantity INTEGER,
  total_cost DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Owner sees all, Employees see their branch
CREATE POLICY "Expense visibility" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'owner' OR branch = expenses.branch)
    )
  );

-- Policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert expenses" ON expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their branch's expenses
CREATE POLICY "Can update own branch expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'owner' OR branch = expenses.branch)
    )
  );

-- ==========================================
-- 7. Indexes for Performance
-- ==========================================
CREATE INDEX idx_purchases_date ON purchases(date);
CREATE INDEX idx_purchases_branch ON purchases(branch);
CREATE INDEX idx_purchase_payments_purchase_id ON purchase_payments(purchase_id);
CREATE INDEX idx_purchase_payments_date ON purchase_payments(date);

CREATE INDEX idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_branch ON deliveries(branch);
CREATE INDEX idx_delivery_payments_delivery_id ON delivery_payments(delivery_id);
CREATE INDEX idx_delivery_payments_date ON delivery_payments(date);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_branch ON expenses(branch);

-- ==========================================
-- 8. Automatic Triggers for Calculated Fields
-- ==========================================

-- Trigger: Update purchase due_amount when paid_amount changes
CREATE OR REPLACE FUNCTION update_purchase_due_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.due_amount = NEW.total_price - NEW.paid_amount;
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purchase_due_amount ON purchases;
CREATE TRIGGER trigger_purchase_due_amount
  BEFORE INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_due_amount();

-- Trigger: Update delivery product_due_amount when product_paid_amount changes
CREATE OR REPLACE FUNCTION update_delivery_due_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.product_due_amount = NEW.total_product_price - NEW.product_paid_amount;
  NEW.driver_total_cost = NEW.driver_payment_amount + NEW.driver_extra_cost;
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delivery_due_amount ON deliveries;
CREATE TRIGGER trigger_delivery_due_amount
  BEFORE INSERT OR UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_due_amount();

-- Trigger: Update profiles updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profile_updated_at ON profiles;
CREATE TRIGGER trigger_profile_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_timestamp();

-- Trigger: Create profile for new auth user
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, branch)
  VALUES (NEW.id, NEW.email, 'employee', NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Silently fail if profile creation fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_profile ON auth.users;
CREATE TRIGGER trigger_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- ==========================================
-- 9. Insert Sample Data (Optional - Comment out if not needed)
-- ==========================================

-- Insert demo owner profile (You'll need to create actual auth user first in Supabase dashboard)
-- INSERT INTO profiles (id, email, role, branch, full_name) 
-- VALUES ('demo-owner-id', 'owner@factory.com', 'owner', NULL, 'Factory Owner');

-- Insert sample purchases
-- INSERT INTO purchases (date, branch, supplier_name, source_location, number_of_bags, price_per_bag, total_price, paid_amount)
-- VALUES 
--   ('2025-11-27', 'Bogura', 'Rahim Traders', 'Dhaka', 100, 500, 50000, 30000),
--   ('2025-11-27', 'Santahar', 'Karim Enterprise', 'Naogaon', 200, 480, 96000, 96000);

-- Insert sample deliveries
-- INSERT INTO deliveries (delivery_date, branch, customer_name, customer_mobile, number_of_bags, price_per_bag, total_product_price, product_paid_amount)
-- VALUES 
--   ('2025-11-27', 'Bogura', 'Jamuna Mills', '01711000000', 150, 600, 90000, 50000),
--   ('2025-11-27', 'Santahar', 'Local Wholesaler', '01999888777', 50, 620, 31000, 31000);

-- Insert sample expenses
-- INSERT INTO expenses (date, branch, category, item_name, quantity, total_cost)
-- VALUES 
--   ('2025-11-27', 'Bogura', 'Labor', '10 Daily Laborers', 10, 5000),
--   ('2025-11-27', 'Santahar', 'Material', 'Plastic Rope', 5, 1200);

-- ==========================================
-- End of Schema
-- ==========================================
