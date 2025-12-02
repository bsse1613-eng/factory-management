# Driver Payment Tracking - Visual Guide

## 🎨 UI Components

### 1. Trucks Page - New Demurrage Button

```
┌─────────────────────────────────────────────────────────┐
│ DH-12-A-1234 - Mohammed Rahman                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Driver: Mohammed Rahman                             │ │
│ │ License: LIC-2024-001                               │ │
│ │ Mobile: 01712345678                                 │ │
│ │                                                     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ [View Details]  [💲 Demurrage]  [✏️ Edit]  [🗑️ Delete]│ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
        Button layout (flex with wrapping)
        💲 = Orange/Gold color, owner only
```

### 2. Truck Demurrage Modal

```
┌────────────────────────────────────────────┐
│ 🟠 Truck Demurrage Cost            [✕]    │
├────────────────────────────────────────────┤
│                                            │
│ 📦 Truck: DH-12-A-1234                    │
│    Driver: Mohammed Rahman                 │
│    Phone: 01712345678                      │
│                                            │
│ 📅 Payment Date:    [_______________]     │
│                                            │
│ 💰 Demurrage Amount (৳):                  │
│    [_______________]                      │
│                                            │
│ 📝 Notes (Optional):                      │
│    ┌─────────────────────────┐            │
│    │ e.g., unloading delay   │            │
│    │ ...                     │            │
│    └─────────────────────────┘            │
│                                            │
│ [Cancel]        [Add Cost]                │
└────────────────────────────────────────────┘
```

### 3. Truck Detail Page - New Statistics

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ 🔵 BLUE          │ 🟠 ORANGE        │ 🟢 GREEN         │ 🔴 RED           │
│                  │                  │                  │                  │
│ TOTAL            │ DRIVER PAYABLE   │ DRIVER PAID      │ DRIVER DUE       │
│ TRANSPORTATIONS  │                  │                  │                  │
│                  │ ৳45,500          │ ৳42,000          │ ৳3,500           │
│ 15               │                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

Layout: 4 equal columns, responsive to 2 columns on mobile
Cards: Shadow, left border in respective color
```

### 4. Driver Payment Records Section

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Driver Payment Records              [+ Add Payment]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📅 Dec 2, 2024    🟠 Truck Demurrage Cost             │
│     Notes: Unloading delay at warehouse               │
│                                    ৳500.00 ──────────► │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📅 Dec 1, 2024    🟢 Regular Payment                  │
│     Notes: Payment for delivery                        │
│                                    ৳5,000.00 ────────► │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📅 Nov 30, 2024   🔵 Advance                          │
│     Notes: Advance for fuel                           │
│                                    ৳2,000.00 ────────► │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5. Add Driver Payment Modal

```
┌────────────────────────────────────────────┐
│ 🟢 Add Driver Payment              [✕]    │
├────────────────────────────────────────────┤
│                                            │
│ 📅 Payment Date:                           │
│    [_______________]                      │
│                                            │
│ 💰 Amount (৳):                            │
│    [_______________]                      │
│                                            │
│ 💳 Payment Type:                          │
│    ┌─────────────────────────┐            │
│    │ ▼ Regular Payment        │            │
│    │ - Truck Demurrage Cost   │            │
│    │ - Advance Payment        │            │
│    └─────────────────────────┘            │
│                                            │
│ 📝 Notes (Optional):                      │
│    ┌─────────────────────────┐            │
│    │                         │            │
│    │ ...                     │            │
│    └─────────────────────────┘            │
│                                            │
│ [Cancel]        [Add Payment]             │
└────────────────────────────────────────────┘
```

## 🎯 User Workflows

### Workflow 1: Add Demurrage Cost (from Trucks Page)

```
1. View Trucks List
   ↓
2. Find Truck Card
   ↓
3. Click 💲 Demurrage Button
   ↓
4. Form Opens
   ├─ Pre-filled: Truck Number, Driver Name, Phone
   ├─ Enter: Payment Date
   ├─ Enter: Amount (e.g., 500 for 2-hour delay)
   └─ Optional: Notes
   ↓
5. Click "Add Cost"
   ↓
6. Modal Closes
   ↓
7. Success! Data Saved
```

### Workflow 2: View Driver Payment Status

```
1. Trucks Page
   ↓
2. Click "View Details" on Any Truck
   ↓
3. See 4 Statistics Cards:
   ├─ Total Transportations: 15
   ├─ Driver Payable: ৳45,500
   ├─ Driver Paid: ৳42,000
   └─ Driver Due: ৳3,500
   ↓
4. Scroll Down
   ↓
5. See "Driver Payment Records" Section
   ├─ All payments listed
   ├─ Color-coded by type
   ├─ Date, Amount, Notes visible
   └─ Complete history available
```

### Workflow 3: Record Driver Payment

```
1. Truck Detail Page
   ↓
2. Click "Add Payment" Button (green)
   ↓
3. Form Opens
   ├─ Enter: Payment Date
   ├─ Enter: Amount (e.g., 5000)
   ├─ Select: Payment Type (Regular/Demurrage/Advance)
   └─ Optional: Notes
   ↓
4. Click "Add Payment"
   ↓
5. Modal Closes
   ↓
6. Statistics Update
   ├─ Driver Paid increases
   └─ Driver Due decreases
   ↓
7. New record visible in payment history
```

## 🎨 Color Scheme

### Status Colors:
```
🔵 Blue     - Regular Payments, Transportations
🟠 Orange   - Demurrage Costs, Payable Amount
🟢 Green    - Driver Paid, Success
🔴 Red      - Driver Due (when > 0)
⚫ Gray     - Driver Due (when = 0)
```

### Component Colors:
```
Headers:    Gradient (Blue→Darker Blue or Orange→Darker Orange)
Buttons:    Blue (View), Green (Add Payment), Orange (Demurrage)
Cards:      White background, colored left border
Badges:     Light background with matching text color
Text:       Dark gray (#1f2937) for normal, colored for emphasis
```

## 📱 Responsive Behavior

### Desktop (1024px+):
```
4 statistics cards in one row
Truck cards in 3 columns grid
Modal centered, max-width 500px
Buttons side-by-side
```

### Tablet (768px - 1023px):
```
4 statistics cards in one row (might wrap to 2x2)
Truck cards in 2 columns grid
Modal centered, max-width 500px
Buttons stack if needed
```

### Mobile (<768px):
```
Statistics cards stack vertically
Truck cards in 1 column
Modal full width with padding
Buttons stack vertically
Font sizes adjusted for readability
```

## 💫 Interactive Elements

### Hover States:
```
Truck Cards:     shadow-md → shadow-lg (lift effect)
Buttons:         color-600 → color-700 (darken)
Links:           underline on hover
```

### Focus States:
```
Form Inputs:     ring-2 ring-orange-500 (outline)
Buttons:         ring-2 ring-offset-2 (focus ring)
```

### Loading States:
```
Submit Button:   disabled:bg-gray-400
                 Text changes to "Adding..."
Modal:           Backdrop opacity-50 (semi-transparent black)
```

## 📊 Data Display Examples

### Scenario: Mohammed Rahman's Truck

```
STATISTICS:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ TRIPS: 5     │ PAYABLE:     │ PAID:        │ DUE:         │
│              │ ৳5,500       │ ৳4,000       │ ৳1,500       │
└──────────────┴──────────────┴──────────────┴──────────────┘

PAYMENT HISTORY:
┌─ Regular Payment ─────────────────────────────────────┐
│ Dec 2, 2024 | Delivery to Sirajganj  | ৳5,000        │
└───────────────────────────────────────────────────────┘
┌─ Demurrage Cost ──────────────────────────────────────┐
│ Dec 2, 2024 | 2-hour unloading delay | ৳500          │
└───────────────────────────────────────────────────────┘
┌─ Regular Payment ─────────────────────────────────────┐
│ Dec 1, 2024 | Advance payment        | ৳4,000        │
└───────────────────────────────────────────────────────┘

CALCULATION:
Payable  = 5,000 (delivery) + 500 (demurrage) + 0 = 5,500
Paid     = 4,000
Due      = 5,500 - 4,000 = 1,500 ⚠️
```

## 🔔 Visual Indicators

### Due Amount Status:
```
Due: ৳0         → Gray text (all paid)
Due: ৳1,000+    → Red text (money owed)
Due: -৳1,000    → Shouldn't happen (red, data issue)
```

### Button Visibility:
```
Add Demurrage  → Only for Owners
Add Payment    → Only for Owners (green button)
View Details   → For Everyone
Edit Truck     → Only for Owners (yellow button)
Delete Truck   → Only for Owners (red button)
```

## 📐 Layout Specifications

### Truck Card Height:
```
Desktop: ~320px (flexible)
Mobile: ~350px (more vertical)
```

### Modal Width:
```
Desktop: max-w-md (448px)
Mobile: w-full (minus padding)
```

### Statistics Cards:
```
Grid: 4 equal columns (25% each)
Gap: 1.5rem (24px)
Padding: 1.5rem (24px)
Min Height: 120px
```

### Font Sizes:
```
Card Title:    0.875rem (14px) gray-500
Main Stat:    1.875rem (30px) font-bold
Sub Info:     0.75rem (12px) gray-500
```

---

**This visual guide helps developers and designers understand the UI/UX of the driver payment tracking system.**
