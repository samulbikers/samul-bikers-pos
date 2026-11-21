export type StockStatus = "in_stock" | "out_of_stock" | "available_on_order";

export type DbBranch = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  manager: string;
  status: string;
  staff: number;
  monthly_revenue: number;
  stock_value: number;
  created_at: string;
  updated_at: string;
};

export type DbStaffAccount = {
  id: string;
  name: string;
  username: string;
  role: "owner" | "manager" | "cashier";
  branch_id: string | null;
  shift: string;
  source: "seed" | "manager";
  created_at: string;
};

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  image_url: string | null;
  sort_order: number;
};

export type DbProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  images: string[] | null;
  price: number;
  show_price: boolean;
  has_discount: boolean;
  discount_price: number | null;
  stock_status: StockStatus;
  stock_quantity: number;
  cost_price: number | null;
  reorder_level: number;
  sku: string | null;
  is_featured: boolean;
  category_id: string | null;
  updated_at: string;
  categories: { name: string; slug: string } | null;
};

export type DbCustomer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  tier: "New" | "Regular" | "Loyal" | "Trade";
  notes: string | null;
  created_at: string;
};

export type DbSaleItem = {
  id: string;
  product_id: string | null;
  product_title: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type DbSale = {
  id: string;
  receipt: string;
  customer_id: string | null;
  customer_name: string;
  cashier: string;
  branch: string;
  payment_method: "M-Pesa" | "Cash" | "Card";
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  status: "Paid" | "Part paid" | "Refunded";
  created_at: string;
  pos_sale_items?: DbSaleItem[];
};

export type DbMovement = {
  id: string;
  product_id: string | null;
  product_title: string;
  movement_type: "Received" | "Sale" | "Adjustment" | "Return";
  quantity: number;
  reference: string | null;
  user_name: string;
  created_at: string;
};

export type DbExpense = {
  id: string;
  reference: string;
  category: "Rent" | "Salaries" | "Utilities" | "Transport" | "Marketing" | "Supplies" | "Licences" | "Other";
  description: string;
  amount: number;
  paid_by: string;
  approved_by: string;
  spent_on: string;
};

export type DbSupplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  terms: string;
  lead_time_days: number;
  rating: number | null;
  outstanding: number;
};

export type DbPurchaseOrder = {
  id: string;
  reference: string;
  supplier_id: string | null;
  supplier_name: string;
  status: "Draft" | "Ordered" | "In transit" | "Received" | "Cancelled";
  ordered_on: string;
  expected_on: string | null;
  items: number;
  amount: number;
};

export type DbSiteSettings = {
  business_name: string;
  tagline: string;
  short_description: string;
  phone: string;
  phone_e164: string;
  whatsapp: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  county: string;
  country: string;
};
