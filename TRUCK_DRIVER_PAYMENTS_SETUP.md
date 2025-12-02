# Truck Driver Payment Tracking System - Setup Guide

## Overview
This feature tracks driver payments separately from deliveries. It allows you to:
- Track how much money each driver is owed
- Record payments made to drivers
- Add demurrage/waiting charges for unloading delays
- View complete driver payment history in the truck profile

## Features

### 1. **Truck Driver Payment Types**
- **Regular Payment**: Standard driver compensation for deliveries
- **Truck Demurrage Cost**: Extra charges for unloading delays/waiting times
- **Advance Payment**: Advance payments to drivers

### 2. **Where to Access**

#### From Trucks Page
- Click the orange dollar icon (💲) on any truck card to add a Truck Demurrage Cost
- Only owners can add/edit demurrage costs

#### From Truck Detail Page
- View complete driver payment summary (4 cards):
  - Total Transportations
  - Driver Payable (total amount owed)
  - Driver Paid (total paid so far)
  - Driver Due (remaining balance)
- Click "Add Payment" button to record driver payments
- View all driver payments in the "Driver Payment Records" section

### 3. **Data Structure**

```typescript
interface TruckDriverPayment {
  id: string;
  truck_id: string;
  driver_name: string;
  driver_mobile: string;
  payment_date: string;      // YYYY-MM-DD format
  amount: number;             // In BDT (Taka)
  payment_type: 'regular' | 'demurrage' | 'advance';
  notes?: string;
  created_at: string;
}
```

## Database Setup

### For Supabase Users:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the contents of `TRUCK_DRIVER_PAYMENTS.sql`
5. Run the query

This will create:
- `truck_driver_payments` table
- Indexes for performance
- RLS (Row Level Security) policies
- Auto-update timestamp function

### Table Structure
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| truck_id | TEXT | Reference to truck |
| driver_name | TEXT | Driver's name |
| driver_mobile | TEXT | Driver's phone |
| payment_date | DATE | Date of payment |
| amount | DECIMAL | Amount in BDT |
| payment_type | TEXT | Type of payment |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Usage Examples

### Scenario 1: Add Regular Payment from Delivery
1. Go to Truck Detail page
2. Click "Add Payment" button
3. Select payment date
4. Enter amount (e.g., 5000)
5. Select "Regular Payment"
6. Add notes if needed
7. Click "Add Payment"

### Scenario 2: Add Demurrage Cost for Waiting Time
1. From Trucks page, find the truck
2. Click the orange dollar icon (💲)
3. System pre-fills truck/driver info
4. Enter payment date
5. Enter demurrage amount (e.g., 500 for 2-hour delay)
6. Notes will auto-show as "Truck Demurrage Cost"
7. Add description (e.g., "Unloading delay at warehouse")
8. Click "Add Cost"

### Scenario 3: View Driver Payment Status
1. From Trucks page, click "View Details" on any truck
2. See 4 statistics cards:
   - **Driver Payable**: ৳5500 (sum of all driver costs from deliveries)
   - **Driver Paid**: ৳5000 (sum of all payments recorded)
   - **Driver Due**: ৳500 (balance remaining)
3. Scroll down to see "Driver Payment Records" section
4. All payments are listed with date, type, and amount

## Access Control

### Owners Can:
- ✅ View all driver payments
- ✅ Add new payments
- ✅ Add demurrage costs
- ✅ View driver statistics
- ✅ View for all trucks

### Employees Can:
- ✅ View driver payments (read-only)
- ❌ Add or edit payments
- ❌ Add demurrage costs
- (Limited by branch in future implementation)

## Key Components Modified

### 1. **types.ts**
- Added `TruckDriverPayment` interface

### 2. **services/mockData.ts**
- Added `mockTruckDriverPayments` for demo data

### 3. **pages/Trucks.tsx**
- Added demurrage cost modal
- Added dollar icon button on truck cards
- Added `handleAddDemurrage` function
- Only visible to owners

### 4. **pages/TruckDetail.tsx**
- Updated statistics to show Driver Payable, Paid, and Due
- Added Driver Payment Records section
- Added payment history modal
- Added `handleAddPayment` function

## Demo Mode

When using demo mode (`userProfile.id === 'demo'`):
- All data uses `mockTruckDriverPayments`
- Payments are added to memory (not persisted)
- Refresh page to reset data
- Perfect for testing UI/workflow

## Sample Data (Demo)

Three sample trucks with driver payments:
- **Truck 1**: Mohammed Rahman
  - Payment 1: ৳5000 (Regular)
  - Payment 2: ৳500 (Demurrage)
  
- **Truck 2**: Ahmed Khan
  - Payment 1: ৳3000 (Regular)

## Color Coding

- **Blue**: Regular Payments
- **Orange**: Demurrage Costs
- **Green**: Advance Payments
- **Red**: Due amount indicator

## Best Practices

1. **Record payments immediately** after paying drivers
2. **Add demurrage charges promptly** when waiting occurs
3. **Use detailed notes** for tracking purposes
4. **Monitor "Driver Due" amount** to avoid delays
5. **Check truck profile** before new deliveries to verify debt

## Troubleshooting

### I don't see the demurrage button
- Check if you're logged in as an owner
- The orange dollar icon should appear on each truck card

### Payments aren't saving
- Ensure Supabase table is created (run SQL)
- Check that RLS policies are enabled
- Try demo mode first to isolate issues

### Driver Due shows negative
- This shouldn't happen in normal use
- May indicate data import issues
- Check truck detail page for discrepancies

## Future Enhancements

- Batch payment processing
- Driver payment receipts (PDF)
- Payment history reports
- Automatic calculation from deliveries
- Driver dashboard view
- Payment reminders/alerts
- Bank transfer tracking

## Support

For issues:
1. Check error console (F12)
2. Verify Supabase connection
3. Ensure table exists and RLS is enabled
4. Test with demo mode
5. Review SQL file for proper setup
