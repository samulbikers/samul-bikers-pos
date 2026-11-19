export type PaymentMethod = "M-Pesa" | "Cash" | "Card";

export type SaleLine = { productId: string; name: string; quantity: number; price: number };

export type Sale = {
  id: string;
  receipt: string;
  date: string;
  time: string;
  customer: string;
  customerId: string | null;
  cashier: string;
  branchId: string;
  method: PaymentMethod;
  lines: SaleLine[];
  amount: number;
  status: "Paid" | "Part paid" | "Refunded";
};

export type PurchaseOrder = {
  id: string;
  reference: string;
  supplierId: string;
  supplier: string;
  orderedOn: string;
  expectedOn: string;
  items: number;
  amount: number;
  status: "Draft" | "Ordered" | "In transit" | "Received" | "Cancelled";
  branchId: string;
};

export type Expense = {
  id: string;
  reference: string;
  category: "Rent" | "Salaries" | "Utilities" | "Transport" | "Marketing" | "Supplies" | "Licences";
  description: string;
  date: string;
  amount: number;
  paidBy: "M-Pesa" | "Bank" | "Cash";
  approvedBy: string;
};

export type StockMovement = {
  id: string;
  date: string;
  product: string;
  sku: string;
  type: "Received" | "Sale" | "Adjustment" | "Return";
  quantity: number;
  reference: string;
  user: string;
};

export const sampleSales: Sale[] = [
  {
    id: "sal-2481", receipt: "SBH-02481", date: "19 Nov 2026", time: "09:42", customer: "Kevin Mutua", customerId: "cus-01", cashier: "Lucy Achieng", branchId: "br-01", method: "M-Pesa", amount: 18500, status: "Paid",
    lines: [
      { productId: "p-01", name: "Full-face riding helmet", quantity: 1, price: 12500 },
      { productId: "p-03", name: "Waterproof riding gloves", quantity: 1, price: 3200 },
      { productId: "p-12", name: "Chain lube and brush kit", quantity: 2, price: 1400 },
    ],
  },
  {
    id: "sal-2480", receipt: "SBH-02480", date: "19 Nov 2026", time: "09:18", customer: "Angela Wanjiru", customerId: "cus-02", cashier: "Lucy Achieng", branchId: "br-01", method: "Cash", amount: 6200, status: "Paid",
    lines: [{ productId: "p-07", name: "Reflective rain suit", quantity: 1, price: 6200 }],
  },
  {
    id: "sal-2479", receipt: "SBH-02479", date: "19 Nov 2026", time: "08:56", customer: "Brian Ochieng", customerId: "cus-03", cashier: "Miriam Wambui", branchId: "br-01", method: "M-Pesa", amount: 24800, status: "Paid",
    lines: [{ productId: "p-08", name: "Aluminium pannier set", quantity: 1, price: 24800 }],
  },
  {
    id: "sal-2478", receipt: "SBH-02478", date: "19 Nov 2026", time: "08:32", customer: "Walk-in customer", customerId: null, cashier: "Lucy Achieng", branchId: "br-01", method: "Card", amount: 12400, status: "Paid",
    lines: [
      { productId: "p-09", name: "Knee and shin guards", quantity: 2, price: 4100 },
      { productId: "p-14", name: "High-visibility vest", quantity: 2, price: 1650 },
      { productId: "p-10", name: "Handlebar phone cradle", quantity: 1, price: 900 },
    ],
  },
  {
    id: "sal-2477", receipt: "SBH-02477", date: "19 Nov 2026", time: "08:11", customer: "Grace Njeri", customerId: "cus-04", cashier: "Miriam Wambui", branchId: "br-01", method: "M-Pesa", amount: 9600, status: "Paid",
    lines: [{ productId: "p-02", name: "Lockable touring tail box", quantity: 1, price: 9600 }],
  },
  {
    id: "sal-2476", receipt: "SBH-02476", date: "18 Nov 2026", time: "17:48", customer: "Boda Fleet Ltd", customerId: "cus-05", cashier: "Esther Njoki", branchId: "br-02", method: "Card", amount: 94700, status: "Part paid",
    lines: [
      { productId: "p-04", name: "Armoured riding jacket", quantity: 4, price: 17500 },
      { productId: "p-01", name: "Full-face riding helmet", quantity: 2, price: 12350 },
    ],
  },
  {
    id: "sal-2475", receipt: "SBH-02475", date: "18 Nov 2026", time: "16:20", customer: "Halima Yusuf", customerId: "cus-07", cashier: "Esther Njoki", branchId: "br-02", method: "M-Pesa", amount: 7400, status: "Paid",
    lines: [{ productId: "p-05", name: "Touring windscreen", quantity: 1, price: 7400 }],
  },
  {
    id: "sal-2474", receipt: "SBH-02474", date: "18 Nov 2026", time: "15:02", customer: "Walk-in customer", customerId: null, cashier: "Lucy Achieng", branchId: "br-01", method: "Cash", amount: 4300, status: "Paid",
    lines: [{ productId: "p-16", name: "LED auxiliary lamp pair", quantity: 1, price: 4300 }],
  },
  {
    id: "sal-2473", receipt: "SBH-02473", date: "17 Nov 2026", time: "13:37", customer: "Nairobi Couriers", customerId: "cus-09", cashier: "Miriam Wambui", branchId: "br-01", method: "Card", amount: 86100, status: "Paid",
    lines: [
      { productId: "p-02", name: "Lockable touring tail box", quantity: 6, price: 9800 },
      { productId: "p-15", name: "Top-box luggage liner", quantity: 12, price: 2275 },
    ],
  },
  {
    id: "sal-2472", receipt: "SBH-02472", date: "17 Nov 2026", time: "11:54", customer: "Dennis Mwangi", customerId: "cus-08", cashier: "Lucy Achieng", branchId: "br-01", method: "M-Pesa", amount: 8900, status: "Refunded",
    lines: [{ productId: "p-13", name: "Riding boots, reinforced", quantity: 1, price: 8900 }],
  },
  {
    id: "sal-2471", receipt: "SBH-02471", date: "17 Nov 2026", time: "10:08", customer: "Faith Achieng", customerId: "cus-10", cashier: "Esther Njoki", branchId: "br-02", method: "Cash", amount: 5600, status: "Paid",
    lines: [{ productId: "p-11", name: "Tank bag with rain cover", quantity: 1, price: 5600 }],
  },
  {
    id: "sal-2470", receipt: "SBH-02470", date: "16 Nov 2026", time: "16:45", customer: "Samuel Kariuki", customerId: "cus-06", cashier: "Brian Kiplagat", branchId: "br-03", method: "M-Pesa", amount: 11400, status: "Paid",
    lines: [
      { productId: "p-06", name: "Phone mount with charger", quantity: 4, price: 2850 },
    ],
  },
];

export const samplePurchaseOrders: PurchaseOrder[] = [
  { id: "po-0098", reference: "PO-2026-0098", supplierId: "sup-01", supplier: "Helmet House Kenya", orderedOn: "16 Nov 2026", expectedOn: "20 Nov 2026", items: 18, amount: 246000, status: "In transit", branchId: "br-01" },
  { id: "po-0097", reference: "PO-2026-0097", supplierId: "sup-02", supplier: "Touratech East Africa", orderedOn: "14 Nov 2026", expectedOn: "26 Nov 2026", items: 32, amount: 512400, status: "Ordered", branchId: "br-01" },
  { id: "po-0096", reference: "PO-2026-0096", supplierId: "sup-04", supplier: "Bike Accessories Hub", orderedOn: "13 Nov 2026", expectedOn: "16 Nov 2026", items: 60, amount: 148900, status: "Received", branchId: "br-01" },
  { id: "po-0095", reference: "PO-2026-0095", supplierId: "sup-03", supplier: "Rider Apparel Importers", orderedOn: "11 Nov 2026", expectedOn: "20 Nov 2026", items: 24, amount: 318200, status: "In transit", branchId: "br-02" },
  { id: "po-0094", reference: "PO-2026-0094", supplierId: "sup-05", supplier: "Mombasa Luggage Works", orderedOn: "08 Nov 2026", expectedOn: "15 Nov 2026", items: 12, amount: 128700, status: "Cancelled", branchId: "br-01" },
  { id: "po-0093", reference: "PO-2026-0093", supplierId: "sup-01", supplier: "Helmet House Kenya", orderedOn: "05 Nov 2026", expectedOn: "09 Nov 2026", items: 40, amount: 412000, status: "Received", branchId: "br-01" },
  { id: "po-0092", reference: "PO-2026-0092", supplierId: "sup-04", supplier: "Bike Accessories Hub", orderedOn: "02 Nov 2026", expectedOn: "05 Nov 2026", items: 96, amount: 224600, status: "Received", branchId: "br-03" },
];

export const sampleExpenses: Expense[] = [
  { id: "exp-0412", reference: "EXP-0412", category: "Rent", description: "Main branch shop rent · November", date: "01 Nov 2026", amount: 85000, paidBy: "Bank", approvedBy: "Samson Muli" },
  { id: "exp-0413", reference: "EXP-0413", category: "Salaries", description: "November staff payroll", date: "05 Nov 2026", amount: 268000, paidBy: "Bank", approvedBy: "Samson Muli" },
  { id: "exp-0414", reference: "EXP-0414", category: "Utilities", description: "Electricity and water · October", date: "07 Nov 2026", amount: 18400, paidBy: "M-Pesa", approvedBy: "Miriam Wambui" },
  { id: "exp-0415", reference: "EXP-0415", category: "Transport", description: "Stock delivery from Mombasa", date: "09 Nov 2026", amount: 27500, paidBy: "Cash", approvedBy: "James Karanja" },
  { id: "exp-0416", reference: "EXP-0416", category: "Marketing", description: "Biker meet-up sponsorship", date: "11 Nov 2026", amount: 42000, paidBy: "M-Pesa", approvedBy: "Miriam Wambui" },
  { id: "exp-0417", reference: "EXP-0417", category: "Supplies", description: "Packaging, bags and receipt rolls", date: "13 Nov 2026", amount: 9650, paidBy: "Cash", approvedBy: "James Karanja" },
  { id: "exp-0418", reference: "EXP-0418", category: "Licences", description: "County single business permit", date: "15 Nov 2026", amount: 31500, paidBy: "Bank", approvedBy: "Samson Muli" },
  { id: "exp-0419", reference: "EXP-0419", category: "Utilities", description: "Internet and POS line rental", date: "17 Nov 2026", amount: 7200, paidBy: "M-Pesa", approvedBy: "Miriam Wambui" },
  { id: "exp-0420", reference: "EXP-0420", category: "Transport", description: "Courier deliveries to Nakuru", date: "18 Nov 2026", amount: 11300, paidBy: "M-Pesa", approvedBy: "Brian Kiplagat" },
];

export const sampleStockMovements: StockMovement[] = [
  { id: "mov-1", date: "19 Nov 2026", product: "Full-face riding helmet", sku: "GEAR-0142", type: "Sale", quantity: -1, reference: "SBH-02481", user: "Lucy Achieng" },
  { id: "mov-2", date: "19 Nov 2026", product: "Waterproof riding gloves", sku: "GEAR-0195", type: "Sale", quantity: -1, reference: "SBH-02481", user: "Lucy Achieng" },
  { id: "mov-3", date: "18 Nov 2026", product: "Aluminium pannier set", sku: "STOR-0134", type: "Sale", quantity: -1, reference: "SBH-02479", user: "Miriam Wambui" },
  { id: "mov-4", date: "17 Nov 2026", product: "Handlebar phone cradle", sku: "ACC-0202", type: "Received", quantity: 40, reference: "PO-2026-0096", user: "James Karanja" },
  { id: "mov-5", date: "17 Nov 2026", product: "LED auxiliary lamp pair", sku: "ACC-0342", type: "Received", quantity: 12, reference: "PO-2026-0096", user: "James Karanja" },
  { id: "mov-6", date: "16 Nov 2026", product: "Reflective rain suit", sku: "GEAR-0288", type: "Return", quantity: 1, reference: "SBH-02466", user: "Miriam Wambui" },
  { id: "mov-7", date: "15 Nov 2026", product: "Chain lube and brush kit", sku: "ACC-0165", type: "Adjustment", quantity: -3, reference: "STK-COUNT-11", user: "James Karanja" },
  { id: "mov-8", date: "14 Nov 2026", product: "Touring windscreen", sku: "ACC-0311", type: "Received", quantity: 8, reference: "PO-2026-0093", user: "James Karanja" },
];

export const monthlyRevenue = [
  { month: "Jun", revenue: 864000, profit: 312000, expenses: 428000 },
  { month: "Jul", revenue: 942000, profit: 348000, expenses: 451000 },
  { month: "Aug", revenue: 1018000, profit: 389000, expenses: 472000 },
  { month: "Sep", revenue: 1124000, profit: 421000, expenses: 498000 },
  { month: "Oct", revenue: 1386000, profit: 512000, expenses: 534000 },
  { month: "Nov", revenue: 1206420, profit: 397120, expenses: 468000 },
];

export const topSellingProducts = [
  { name: "Chain lube and brush kit", units: 208, revenue: 301600 },
  { name: "Handlebar phone cradle", units: 143, revenue: 271700 },
  { name: "Phone mount with charger", units: 121, revenue: 344850 },
  { name: "High-visibility vest", units: 96, revenue: 158400 },
  { name: "Waterproof riding gloves", units: 88, revenue: 281600 },
];

export const expenseSplit = [
  { category: "Salaries", amount: 268000 },
  { category: "Rent", amount: 85000 },
  { category: "Marketing", amount: 42000 },
  { category: "Licences", amount: 31500 },
  { category: "Transport", amount: 38800 },
  { category: "Utilities", amount: 25600 },
  { category: "Supplies", amount: 9650 },
];
