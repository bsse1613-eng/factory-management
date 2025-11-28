# Testing Checklist - Product Name Feature

## 📋 Pre-Deployment Testing Checklist

### ✅ Environment Setup
- [ ] Supabase database connection is working
- [ ] TypeScript compilation has no errors
- [ ] All dependencies are installed
- [ ] Development server runs without errors
- [ ] Browser console shows no warnings for product name features

---

## 🧪 Purchases Module Tests

### Test 1: Form Display
```
Step 1: Navigate to Purchases page
Step 2: Click "Add Entry" button
Expected: Modal opens with all form fields including "Product Name"
Result: ☐ PASS ☐ FAIL
```

### Test 2: Product Name Input
```
Step 1: In Purchases form, locate "Product Name" field
Step 2: Enter test value: "Test Rice"
Step 3: Fill other required fields
Step 4: Click Save
Expected: No errors, entry saved successfully
Result: ☐ PASS ☐ FAIL
Note: ___________________________________________
```

### Test 3: Database Storage
```
Step 1: Add purchase with product_name = "Wheat"
Step 2: Refresh page
Step 3: Check that entry appears in table
Step 4: Verify product name is displayed if added
Expected: Product name persists after refresh
Result: ☐ PASS ☐ FAIL
Database: ☐ Verified in Supabase ☐ Not checked
```

### Test 4: Empty Product Name
```
Step 1: Add purchase WITHOUT filling product_name
Step 2: Save and view PDF
Expected: PDF shows "Raw Material" as fallback
Result: ☐ PASS ☐ FAIL
```

### Test 5: PDF Download with Product Name
```
Step 1: Add purchase with product_name = "Cotton"
Step 2: Click Download button
Step 3: Check PDF file
Expected: PDF shows "Cotton" in Product Name row
Result: ☐ PASS ☐ FAIL
PDF Preview: ___________________________________________
```

### Test 6: PDF Print with Product Name
```
Step 1: Add purchase with product_name = "Jute"
Step 2: Click Print button
Step 3: Print preview opens
Expected: Print preview shows "Jute" in details table
Result: ☐ PASS ☐ FAIL
```

### Test 7: Form Reset
```
Step 1: Add purchase with product_name = "Flour"
Step 2: Click Save
Step 3: Check if form fields reset
Expected: All fields including product_name are cleared
Result: ☐ PASS ☐ FAIL
```

### Test 8: Multiple Products
```
Step 1: Add 3 purchases with different product names
       - Purchase 1: "Rice"
       - Purchase 2: "Wheat"
       - Purchase 3: "Cotton"
Step 2: Verify all appear in list
Expected: All three different product names display correctly
Result: ☐ PASS ☐ FAIL
```

---

## 🚚 Deliveries Module Tests

### Test 9: Form Display
```
Step 1: Navigate to Deliveries page
Step 2: Click "Add Entry" button
Expected: Modal opens with all form fields including "Product Name"
Result: ☐ PASS ☐ FAIL
Location: Check product name field is after "Truck No": ☐ YES ☐ NO
```

### Test 10: Product Name Input
```
Step 1: In Deliveries form, locate "Product Name" field
Step 2: Enter test value: "Test Fabric"
Step 3: Fill other required fields
Step 4: Click Save
Expected: No errors, entry saved successfully
Result: ☐ PASS ☐ FAIL
```

### Test 11: Database Storage
```
Step 1: Add delivery with product_name = "Cotton Fabric"
Step 2: Refresh page
Step 3: Check that entry appears in table
Expected: Product name persists after refresh
Result: ☐ PASS ☐ FAIL
Database: ☐ Verified ☐ Not checked
```

### Test 12: Empty Product Name
```
Step 1: Add delivery WITHOUT filling product_name
Step 2: Save and view PDF
Expected: PDF shows "Finished Goods / Product" as fallback
Result: ☐ PASS ☐ FAIL
```

### Test 13: PDF Download with Product Name
```
Step 1: Add delivery with product_name = "Processed Jute"
Step 2: Click Download button
Step 3: Check PDF file
Expected: PDF shows "Processed Jute" in item description
Result: ☐ PASS ☐ FAIL
PDF Preview: ___________________________________________
```

### Test 14: PDF Print with Product Name
```
Step 1: Add delivery with product_name = "Refined Goods"
Step 2: Click Print button
Step 3: Print preview opens
Expected: Print preview shows product name in challan
Result: ☐ PASS ☐ FAIL
```

### Test 15: Form Reset
```
Step 1: Add delivery with product_name = "Finished Product"
Step 2: Click Save
Step 3: Check if form fields reset
Expected: All fields including product_name are cleared
Result: ☐ PASS ☐ FAIL
```

---

## 🔄 Integration Tests

### Test 16: Purchase to PDF Complete Workflow
```
Step 1: Add purchase with product_name = "Quality Rice"
Step 2: Download PDF
Step 3: Print PDF
Step 4: Verify product name in both
Expected: Product name appears correctly in all formats
Result: ☐ PASS ☐ FAIL
```

### Test 17: Delivery to PDF Complete Workflow
```
Step 1: Add delivery with product_name = "Premium Cloth"
Step 2: Download PDF
Step 3: Print PDF
Step 4: Verify product name in both
Expected: Product name appears correctly in all formats
Result: ☐ PASS ☐ FAIL
```

### Test 18: Demo Mode
```
Step 1: Login as demo user
Step 2: Check Purchases page - should show mock data with product names
Step 3: Check Deliveries page - should show mock data with product names
Expected: Demo data displays correctly with product names
Purchases Demo Products: ☐ Raw Jute ☐ Cotton Fiber ☐ Other: _______
Deliveries Demo Products: ☐ Processed Jute ☐ Cotton Fabric ☐ Other: _______
Result: ☐ PASS ☐ FAIL
```

---

## 🖥️ Browser & Device Tests

### Test 19: Desktop Browser
```
Browser: [Chrome / Firefox / Safari / Edge]
Step 1: Test form display on desktop
Step 2: Test PDF generation
Step 3: Test print functionality
Expected: All features work on desktop browser
Result: ☐ PASS ☐ FAIL
```

### Test 20: Mobile Browser
```
Device: [iPhone / Android]
Step 1: Test form display on mobile
Step 2: Test PDF download on mobile
Step 3: Test print functionality on mobile
Expected: All features work on mobile
Result: ☐ PASS ☐ FAIL
Responsive Issues: ___________________________________________
```

### Test 21: Tablet
```
Device: [iPad / Android Tablet]
Step 1: Test form responsiveness
Step 2: Test PDF generation
Expected: Tablet view displays correctly
Result: ☐ PASS ☐ FAIL
```

---

## 🔐 Security Tests

### Test 22: Branch Access Control
```
Step 1: Login as Bogura branch employee
Step 2: Add purchase with product_name
Step 3: Verify only Bogura branch sees this purchase
Step 4: Login as Santahar branch employee
Step 5: Verify this purchase is NOT visible
Expected: Branch access control maintained
Result: ☐ PASS ☐ FAIL
```

### Test 23: Data Isolation
```
Step 1: Add multiple purchases with different branches
Step 2: Verify data isolation per branch
Expected: Each branch only sees their own data
Result: ☐ PASS ☐ FAIL
```

---

## 🐛 Error Handling Tests

### Test 24: Network Error Handling
```
Step 1: Go offline
Step 2: Try to submit purchase with product name
Expected: Appropriate error message displayed
Result: ☐ PASS ☐ FAIL
Error Message: ___________________________________________
```

### Test 25: Invalid Input
```
Step 1: Try special characters in product_name: "<script>alert()"
Step 2: Try very long text (>1000 chars)
Step 3: Try SQL injection attempt
Expected: Input handled safely, no errors
Result: ☐ PASS ☐ FAIL
```

### Test 26: Concurrent Operations
```
Step 1: Open two browser tabs
Step 2: Add purchase in tab 1
Step 3: Add delivery in tab 2 simultaneously
Expected: Both operations complete successfully
Result: ☐ PASS ☐ FAIL
```

---

## 📊 Data Validation Tests

### Test 27: Special Characters
```
Step 1: Enter product_name: "Rice (Premium) - Basmati"
Step 2: Submit
Expected: Special characters saved and displayed correctly
Result: ☐ PASS ☐ FAIL
```

### Test 28: Unicode Characters
```
Step 1: Enter product_name: "চাল" (Bengali for Rice)
Step 2: Submit
Expected: Unicode characters saved and displayed correctly
Result: ☐ PASS ☐ FAIL
```

### Test 29: Very Long Product Name
```
Step 1: Enter 500+ character product name
Step 2: Submit
Expected: Either saved/truncated appropriately or error message
Result: ☐ PASS ☐ FAIL
Handling Method: ☐ Saved ☐ Truncated ☐ Error
```

### Test 30: Spaces and Formatting
```
Step 1: Enter product_name: "   Trimmed Spaces   "
Step 2: Submit
Expected: Spaces handled appropriately
Result: ☐ PASS ☐ FAIL
```

---

## 📱 UI/UX Tests

### Test 31: Form Layout
```
Step 1: Check Purchases form layout
Step 2: Check Deliveries form layout
Expected: Product Name field clearly visible, properly labeled
Result: ☐ PASS ☐ FAIL
```

### Test 32: Field Visibility
```
Step 1: Check if product_name field has appropriate:
   - Label: ☐ YES ☐ NO
   - Placeholder text: ☐ YES ☐ NO
   - Instructions: ☐ YES ☐ NO
Expected: All UX elements present
Result: ☐ PASS ☐ FAIL
```

### Test 33: PDF Formatting
```
Step 1: Generate PDF with long product name
Step 2: Check formatting in PDF
Expected: Product name displays well, doesn't break layout
Result: ☐ PASS ☐ FAIL
```

---

## 🚀 Performance Tests

### Test 34: Form Load Time
```
Step 1: Load Purchases form
Step 2: Note load time
Expected: Form loads in < 2 seconds
Load Time: __________ seconds
Result: ☐ PASS ☐ FAIL
```

### Test 35: PDF Generation Time
```
Step 1: Click PDF download
Step 2: Note generation time
Expected: PDF generates in < 5 seconds
Generation Time: __________ seconds
Result: ☐ PASS ☐ FAIL
```

### Test 36: Database Query Performance
```
Step 1: Add 100+ records with product names
Step 2: Load page
Expected: Page loads normally, no lag
Result: ☐ PASS ☐ FAIL
Query Time: __________ ms
```

---

## 📋 Final Verification

### Code Quality
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] No console warnings related to product_name
- [ ] All imports resolved correctly
- [ ] No unused variables

### Database
- [ ] product_name column exists in purchases table
- [ ] product_name column exists in deliveries table
- [ ] Columns are nullable (allow NULL values)
- [ ] Data types are TEXT
- [ ] No migration errors

### Functionality
- [ ] Product name collected in Purchases form
- [ ] Product name collected in Deliveries form
- [ ] Product name saved to database
- [ ] Product name displayed in Purchase PDF
- [ ] Product name displayed in Delivery PDF
- [ ] Product name displays in print preview
- [ ] Fallback values work correctly

### Documentation
- [ ] Implementation summary created
- [ ] Quick guide created
- [ ] SQL setup commands provided
- [ ] User-facing documentation complete

---

## ✅ Sign-Off

| Item | Tester | Date | Status |
|------|--------|------|--------|
| Code Review | | | ☐ PASS ☐ FAIL |
| Functional Testing | | | ☐ PASS ☐ FAIL |
| Integration Testing | | | ☐ PASS ☐ FAIL |
| Security Testing | | | ☐ PASS ☐ FAIL |
| Performance Testing | | | ☐ PASS ☐ FAIL |
| **OVERALL** | | | ☐ READY ☐ NOT READY |

---

## 📝 Known Issues / Notes

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## 🎯 Ready for Production?

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Documentation complete
- [ ] Team approval received
- [ ] Backup created
- [ ] Rollback plan prepared

**PRODUCTION READY:** ☐ YES ☐ NO

**Deployment Date:** ________________

**Deployed By:** ________________

---

**Last Updated:** November 28, 2025  
**Version:** 1.0
