-- Fix: Calculate total_product_price on INSERT
-- Run this in Supabase SQL Editor

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_delivery_due_amount ON deliveries;
DROP FUNCTION IF EXISTS update_delivery_due_amount();

-- Create new trigger that calculates BOTH total_product_price and due_amount
CREATE OR REPLACE FUNCTION update_delivery_due_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_product_price if not provided
  IF NEW.total_product_price IS NULL OR NEW.total_product_price = 0 THEN
    NEW.total_product_price = NEW.number_of_bags * NEW.price_per_bag;
  END IF;
  
  -- Calculate product_due_amount
  NEW.product_due_amount = NEW.total_product_price - COALESCE(NEW.product_paid_amount, 0);
  
  -- Calculate driver_total_cost
  NEW.driver_total_cost = COALESCE(NEW.driver_payment_amount, 0) + COALESCE(NEW.driver_extra_cost, 0);
  
  -- Set timestamp
  NEW.updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_delivery_due_amount
  BEFORE INSERT OR UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_due_amount();

-- Do the same for purchases
DROP TRIGGER IF EXISTS trigger_purchase_due_amount ON purchases;
DROP FUNCTION IF EXISTS update_purchase_due_amount();

CREATE OR REPLACE FUNCTION update_purchase_due_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_price if not provided
  IF NEW.total_price IS NULL OR NEW.total_price = 0 THEN
    NEW.total_price = NEW.number_of_bags * NEW.price_per_bag;
  END IF;
  
  -- Calculate due_amount
  NEW.due_amount = NEW.total_price - COALESCE(NEW.paid_amount, 0);
  
  -- Set timestamp
  NEW.updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_purchase_due_amount
  BEFORE INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_due_amount();
