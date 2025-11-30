import { Purchase, Delivery, Expense, PurchasePayment, DeliveryPayment, Supplier, Customer } from '../types';

export const mockPurchases: Purchase[] = [
  {
    id: 'demo-p-1',
    created_at: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    branch: 'Bogura',
    supplier_name: 'Rahim Traders',
    source_location: 'Dhaka',
    product_name: 'Raw Jute',
    number_of_bags: 100,
    price_per_bag: 500,
    total_price: 50000,
    paid_amount: 30000,
    due_amount: 20000,
    notes: 'Premium Quality Jute'
  },
  {
    id: 'demo-p-2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    branch: 'Santahar',
    supplier_name: 'Karim Enterprise',
    source_location: 'Naogaon',
    product_name: 'Cotton Fiber',
    number_of_bags: 200,
    price_per_bag: 480,
    total_price: 96000,
    paid_amount: 96000,
    due_amount: 0,
    notes: 'Paid in full'
  }
];

export const mockPurchasePayments: PurchasePayment[] = [
  {
    id: 'pay-1',
    purchase_id: 'demo-p-1',
    date: new Date().toISOString().split('T')[0],
    amount: 30000,
    notes: 'Initial Advance'
  }
];

export const mockDeliveries: Delivery[] = [
  {
    id: 'demo-d-1',
    created_at: new Date().toISOString(),
    delivery_date: new Date().toISOString().split('T')[0],
    branch: 'Bogura',
    customer_name: 'Jamuna Mills',
    customer_address: 'Sirajganj',
    customer_mobile: '01711000000',
    driver_name: 'Mokbul',
    truck_number: 'DHK-METRO-1122',
    product_name: 'Processed Jute',
    number_of_bags: 150,
    price_per_bag: 600,
    total_product_price: 90000,
    product_paid_amount: 50000,
    product_due_amount: 40000,
    driver_payment_amount: 5000,
    driver_extra_cost: 500,
    driver_total_cost: 5500,
    driver_notes: 'Waiting charge included'
  },
  {
    id: 'demo-d-2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    delivery_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    branch: 'Santahar',
    customer_name: 'Local Wholesaler',
    customer_address: 'Bogra Bazar',
    customer_mobile: '01999888777',
    driver_name: 'Sattar',
    truck_number: 'BOG-T-4455',
    product_name: 'Cotton Fabric',
    number_of_bags: 50,
    price_per_bag: 620,
    total_product_price: 31000,
    product_paid_amount: 31000,
    product_due_amount: 0,
    driver_payment_amount: 2000,
    driver_extra_cost: 0,
    driver_total_cost: 2000
  }
];

export const mockDeliveryPayments: DeliveryPayment[] = [
  {
    id: 'dpay-1',
    delivery_id: 'demo-d-1',
    date: new Date().toISOString().split('T')[0],
    amount: 50000,
    notes: 'Bank Transfer'
  }
];

export const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    created_at: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    branch: 'Bogura',
    category: 'Labor',
    item_name: '10 Daily Laborers',
    quantity: 10,
    total_cost: 5000,
    notes: 'Unloading raw materials'
  },
  {
    id: 'exp-2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    branch: 'Santahar',
    category: 'Material',
    item_name: 'Plastic Rope',
    quantity: 5,
    total_cost: 1200,
    notes: 'For packaging'
  }
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'supp-1',
    created_at: new Date().toISOString(),
    branch: 'Bogura',
    supplier_name: 'Rahim Traders',
    contact_person: 'Rahim Ahmed',
    source_location: 'Dhaka',
    mobile_number: '01711234567',
    email: 'rahim@traders.com',
    notes: 'Regular supplier of Raw Jute'
  },
  {
    id: 'supp-2',
    created_at: new Date().toISOString(),
    branch: 'Santahar',
    supplier_name: 'Karim Enterprise',
    contact_person: 'Karim Hossain',
    source_location: 'Naogaon',
    mobile_number: '01998765432',
    email: 'karim@enterprise.com',
    notes: 'Cotton Fiber supplier'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    created_at: new Date().toISOString(),
    branch: 'Bogura',
    customer_name: 'Jamuna Mills',
    contact_person: 'Jamuna Roy',
    customer_address: 'Sirajganj',
    customer_mobile: '01711000000',
    email: 'jamuna@mills.com',
    notes: 'Large regular buyer of processed jute'
  },
  {
    id: 'cust-2',
    created_at: new Date().toISOString(),
    branch: 'Santahar',
    customer_name: 'Local Wholesaler',
    contact_person: 'Shakib Ali',
    customer_address: 'Bogra Bazar',
    customer_mobile: '01999888777',
    email: 'shakib@wholesale.com',
    notes: 'Local distribution partner'
  }
];