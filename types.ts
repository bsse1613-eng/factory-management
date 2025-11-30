export type Branch = 'Bogura' | 'Santahar';
export type Role = 'owner' | 'employee';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  branch: Branch | null;
  full_name?: string;
}

export interface Supplier {
  id: string;
  created_at: string;
  branch: Branch;
  supplier_name: string;
  contact_person?: string;
  source_location: string;
  mobile_number: string;
  email?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  created_at: string;
  branch: Branch;
  customer_name: string;
  contact_person?: string;
  customer_address: string;
  customer_mobile: string;
  email?: string;
  notes?: string;
}

export interface Purchase {
  id: string;
  created_at: string;
  date: string;
  branch: Branch;
  supplier_name: string;
  source_location: string;
  product_name?: string;
  number_of_bags: number;
  price_per_bag: number;
  total_price: number;
  paid_amount: number;
  due_amount: number;
  notes?: string;
}

export interface PurchasePayment {
  id: string;
  purchase_id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface Delivery {
  id: string;
  created_at: string;
  delivery_date: string;
  branch: Branch;
  customer_name: string;
  customer_address: string;
  customer_mobile: string;
  driver_name: string;
  truck_number: string;
  product_name?: string;
  number_of_bags: number;
  price_per_bag: number;
  total_product_price: number;
  product_paid_amount: number;
  product_due_amount: number;
  driver_payment_amount: number;
  driver_extra_cost: number;
  driver_total_cost: number;
  driver_notes?: string;
}

export interface DeliveryPayment {
  id: string;
  delivery_id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface Expense {
  id: string;
  created_at: string;
  date: string;
  branch: Branch;
  category: 'Material' | 'Labor';
  item_name?: string;
  quantity?: number;
  total_cost: number;
  notes?: string;
}

export interface DashboardSummary {
  totalPurchase: number;
  totalSales: number;
  totalDeliveryCost: number;
  totalExpenses: number;
  netProfit: number;
  totalDueReceivable: number; // Money people owe us
  totalDuePayable: number;    // Money we owe suppliers
}