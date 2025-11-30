# Fleet Management System - Complete Guide ✅

**Status:** ✅ COMPLETE AND DEPLOYED  
**Date:** November 30, 2025  
**Build:** SUCCESS (2,664 modules)  
**GitHub:** Pushed & Live

---

## 🚚 Overview

The Fleet Management system allows you to manage all your trucks, drivers, and track every transportation made by each vehicle. No more repetitive data entry!

### Key Features

✅ **Add & Manage Trucks** - Store truck information with driver details  
✅ **Driver Information** - License number, mobile, vehicle type, capacity  
✅ **Transportation History** - See all purchases and deliveries made by each truck  
✅ **Payment Tracking** - View all payment history for transactions done by each truck  
✅ **Search & Filter** - Quick search by truck number, driver name, license, or phone  
✅ **Auto-Population** - Truck info automatically populates in Purchases/Deliveries forms

---

## 📍 Access Points

### Main Menu
Navigate from left sidebar: **Fleet Management** → Opens Trucks List

### Direct Routes
- **Trucks List**: `/trucks`
- **Truck Details**: `/trucks/{truckId}`

---

## 🚀 How to Use

### 1. Add a New Truck

1. Go to **Fleet Management** from the sidebar
2. Click **"Add Truck"** button (top right)
3. Fill in the form:
   - **Truck Number**: e.g., `DH-12-A-1234`
   - **Driver Name**: e.g., `Mohammed Rahman`
   - **License Number**: e.g., `LIC-2024-001`
   - **Mobile Number**: e.g., `01712345678`
   - **Vehicle Type**: Select from dropdown (Truck, Van, Pickup, Lorry, Other)
   - **Capacity**: Bags the truck can carry (e.g., `500`)
   - **Notes**: Optional maintenance notes or details
4. Click **"Add Truck"** button
5. Truck appears in the fleet list

### 2. View Truck Details

1. From **Fleet Management** list, click **"View Details"** on any truck card
2. You'll see:
   - **Driver Information** - Name, license, mobile contact
   - **Statistics** - Total transportations, total amount, total payments
   - **Transportation History** - Complete record of all purchases and deliveries

### 3. Edit a Truck

1. From **Fleet Management** list, click the **Edit** (pencil) button on truck card
2. Update the information in the modal
3. Click **"Update Truck"** button

### 4. Delete a Truck

1. From **Fleet Management** list, click the **Delete** (trash) button on truck card
2. Confirm the deletion
3. Truck is removed from the system

### 5. Search Trucks

1. On **Fleet Management** page, use the search bar at the top
2. Search by:
   - Truck number
   - Driver name
   - License number
   - Phone number
3. Results filter in real-time

---

## 📊 Transportation History

When you view a truck's details, you can see all transportations:

### What's Tracked

**For Each Transportation:**
- **Date** - When it occurred
- **Type** - Purchase or Delivery
- **Customer/Supplier** - Who the transaction was with
- **Product** - What was transported
- **Quantity** - Number of bags
- **Amount** - Total cost
- **Payment Status** - How much paid, how much due
- **Payment History** - All payments made for that transaction

### Example View

```
Date: November 28, 2025
Type: Delivery (Green Badge)
Customer: Local Wholesaler
Product: Rice
Quantity: 100 Bags
Amount: ৳50,000

Payment Records (2):
  - Nov 20: ৳30,000 (Bank Transfer)
  - Nov 25: ৳20,000 (Cash)
```

---

## 🔄 Integration with Purchases & Deliveries

When adding a **Purchase** or **Delivery**, you now select from pre-configured trucks:

### Before (Old Way)
❌ Had to type driver name every time  
❌ Had to remember license number  
❌ Inconsistent data entry  

### After (New Way)
✅ Select truck → Auto-fills driver name & info  
✅ No more typing the same data repeatedly  
✅ Consistent information across all transactions  

---

## 📈 Statistics Dashboard

Each truck's detail page shows:

**Total Transportations** - How many times this truck was used  
**Total Amount** - Sum of all goods transported  
**Total Payments** - How much has been paid for all transactions  

Example:
```
Total Transportations: 45
Total Amount: ৳2,250,000
Total Payments: ৳1,890,000
```

---

## 👤 Access Control

### Owners
✅ Add trucks  
✅ Edit trucks  
✅ Delete trucks  
✅ View all transportation history  
✅ See all payment records  

### Employees
✅ View truck list  
✅ View transportation history  
✅ See payment records  
❌ Cannot delete trucks (owner only)  

---

## 🗄️ Database Schema

### Trucks Table
```sql
CREATE TABLE trucks (
  id UUID PRIMARY KEY,
  truck_number TEXT NOT NULL UNIQUE,
  driver_name TEXT NOT NULL,
  driver_license TEXT NOT NULL,
  driver_mobile TEXT NOT NULL,
  vehicle_type TEXT,
  capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMP
);
```

---

## 🔍 Troubleshooting

### Issue: Truck doesn't appear in Purchases/Deliveries form
**Solution**: Make sure truck is added first in Fleet Management

### Issue: Driver info not auto-populating
**Solution**: Select the truck from dropdown - it will auto-fill

### Issue: Can't delete a truck
**Solution**: Only owners can delete. Log in as owner account.

### Issue: Capacity showing as 0
**Solution**: Capacity must be a number. Re-edit the truck with valid number.

---

## 📱 Mobile Responsive

The Fleet Management system works perfectly on:
- ✅ Desktop (full grid view)
- ✅ Tablet (2-column layout)
- ✅ Mobile (1-column stacked layout)

---

## 🎯 Quick Tips

1. **Keep driver mobile updated** - Easy to call drivers for urgent pickups
2. **Use meaningful truck numbers** - Include branch info (e.g., `DH-12` for Dhaka, `B-01` for Bogura)
3. **Add capacity info** - Helps plan which truck to use for orders
4. **Regular maintenance notes** - Track vehicle condition over time

---

## 📊 Typical Workflow

```
1. ADD TRUCK
   ↓
2. USE TRUCK IN PURCHASES/DELIVERIES
   ↓
3. VIEW TRUCK DETAILS
   ↓
4. SEE ALL HISTORY & PAYMENTS
   ↓
5. MAKE DECISIONS FOR ROUTE OPTIMIZATION
```

---

## 🔐 Features Locked by Role

| Feature | Owner | Employee |
|---------|-------|----------|
| Add Truck | ✅ | ❌ |
| Edit Truck | ✅ | ❌ |
| Delete Truck | ✅ | ❌ |
| View Fleet List | ✅ | ✅ |
| View Truck Details | ✅ | ✅ |
| View Transport History | ✅ | ✅ |
| View Payment Records | ✅ | ✅ |

---

## 📞 Support

### Common Questions

**Q: How many trucks can I add?**  
A: Unlimited! Add as many as you need.

**Q: Can I change driver info after adding a truck?**  
A: Yes, click Edit button and update driver details.

**Q: Does changing truck info affect past transactions?**  
A: No, past transactions keep their original data. Only future uses of the truck will show new info.

**Q: Can employees add trucks?**  
A: No, only owners. Employees can view and use trucks.

---

## 🚀 Getting Started

```
1. Go to Fleet Management
2. Click "Add Your First Truck"
3. Fill in driver and vehicle info
4. Start using trucks in Purchases/Deliveries
5. View transportation history anytime
```

---

## 📝 Notes

- Truck information is stored securely in the database
- All transportation history is automatically tracked
- Payment records are maintained for audit purposes
- Search works in real-time across all truck fields
- Mobile contact is clickable (direct call on mobile devices)

---

**Status: ✅ READY FOR PRODUCTION**  
**Last Updated:** November 30, 2025  
**Build:** SUCCESS (2,664 modules)
