export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  orders: number;
  totalSpend: number;
  lastVisit: string;
  tier: "New" | "Regular" | "Loyal" | "Trade";
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  terms: string;
  leadTimeDays: number;
  products: number;
  outstanding: number;
  rating: number;
};

export type StaffMember = {
  id: string;
  name: string;
  role: "Owner" | "Manager" | "Cashier" | "Storekeeper" | "Technician";
  branchId: string;
  status: "Active" | "On leave" | "Inactive";
  shift: string;
  salesThisMonth: number;
  email: string;
};

export type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  manager: string;
  phone: string;
  staff: number;
  monthlyRevenue: number;
  stockValue: number;
  status: "Open" | "Closing soon" | "Closed";
};

export const sampleCustomers: Customer[] = [
  { id: "cus-01", name: "Kevin Mutua", phone: "+254 712 334 871", email: "kevin.mutua@example.co.ke", location: "Westlands", orders: 14, totalSpend: 274500, lastVisit: "19 Nov 2026", tier: "Loyal" },
  { id: "cus-02", name: "Angela Wanjiru", phone: "+254 733 902 114", email: "angela.w@example.co.ke", location: "Kilimani", orders: 6, totalSpend: 86400, lastVisit: "19 Nov 2026", tier: "Regular" },
  { id: "cus-03", name: "Brian Ochieng", phone: "+254 701 448 902", email: "brian.ochieng@example.co.ke", location: "South B", orders: 9, totalSpend: 168900, lastVisit: "18 Nov 2026", tier: "Regular" },
  { id: "cus-04", name: "Grace Njeri", phone: "+254 720 671 553", email: "grace.njeri@example.co.ke", location: "Kileleshwa", orders: 21, totalSpend: 402300, lastVisit: "18 Nov 2026", tier: "Loyal" },
  { id: "cus-05", name: "Boda Fleet Ltd", phone: "+254 795 220 118", email: "orders@bodafleet.co.ke", location: "Industrial Area", orders: 32, totalSpend: 982400, lastVisit: "16 Nov 2026", tier: "Trade" },
  { id: "cus-06", name: "Samuel Kariuki", phone: "+254 711 205 337", email: "sam.kariuki@example.co.ke", location: "Ruaka", orders: 3, totalSpend: 31200, lastVisit: "14 Nov 2026", tier: "New" },
  { id: "cus-07", name: "Halima Yusuf", phone: "+254 745 889 002", email: "halima.yusuf@example.co.ke", location: "Eastleigh", orders: 11, totalSpend: 143700, lastVisit: "12 Nov 2026", tier: "Regular" },
  { id: "cus-08", name: "Dennis Mwangi", phone: "+254 799 114 760", email: "dennis.mwangi@example.co.ke", location: "Thika Road", orders: 5, totalSpend: 64800, lastVisit: "09 Nov 2026", tier: "Regular" },
  { id: "cus-09", name: "Nairobi Couriers", phone: "+254 786 330 501", email: "buying@nairobicouriers.co.ke", location: "Embakasi", orders: 26, totalSpend: 614900, lastVisit: "08 Nov 2026", tier: "Trade" },
  { id: "cus-10", name: "Faith Achieng", phone: "+254 728 943 610", email: "faith.achieng@example.co.ke", location: "Langata", orders: 2, totalSpend: 18700, lastVisit: "05 Nov 2026", tier: "New" },
];

export const sampleSuppliers: Supplier[] = [
  { id: "sup-01", name: "Helmet House Kenya", contact: "Peter Njoroge", phone: "+254 720 118 442", terms: "Net 30", leadTimeDays: 4, products: 8, outstanding: 184000, rating: 4.6 },
  { id: "sup-02", name: "Touratech East Africa", contact: "Sarah Kimani", phone: "+254 733 552 018", terms: "Net 45", leadTimeDays: 12, products: 14, outstanding: 412500, rating: 4.8 },
  { id: "sup-03", name: "Rider Apparel Importers", contact: "Joseph Otieno", phone: "+254 701 887 233", terms: "Net 15", leadTimeDays: 9, products: 11, outstanding: 96800, rating: 4.2 },
  { id: "sup-04", name: "Bike Accessories Hub", contact: "Mary Waithera", phone: "+254 745 007 991", terms: "Cash on delivery", leadTimeDays: 3, products: 22, outstanding: 0, rating: 4.4 },
  { id: "sup-05", name: "Mombasa Luggage Works", contact: "Ali Hassan", phone: "+254 712 664 330", terms: "Net 30", leadTimeDays: 7, products: 6, outstanding: 128700, rating: 3.9 },
];

export const sampleStaff: StaffMember[] = [
  { id: "stf-01", name: "Samson Muli", role: "Owner", branchId: "br-01", status: "Active", shift: "Full day", salesThisMonth: 0, email: "samson@samulbikers.co.ke" },
  { id: "stf-02", name: "Miriam Wambui", role: "Manager", branchId: "br-01", status: "Active", shift: "08:00 – 17:00", salesThisMonth: 486200, email: "miriam@samulbikers.co.ke" },
  { id: "stf-03", name: "James Karanja", role: "Storekeeper", branchId: "br-01", status: "Active", shift: "07:00 – 16:00", salesThisMonth: 0, email: "james@samulbikers.co.ke" },
  { id: "stf-04", name: "Lucy Achieng", role: "Cashier", branchId: "br-01", status: "Active", shift: "09:00 – 18:00", salesThisMonth: 318700, email: "lucy@samulbikers.co.ke" },
  { id: "stf-05", name: "Dennis Otieno", role: "Technician", branchId: "br-02", status: "On leave", shift: "10:00 – 19:00", salesThisMonth: 0, email: "dennis@samulbikers.co.ke" },
  { id: "stf-06", name: "Esther Njoki", role: "Cashier", branchId: "br-02", status: "Active", shift: "09:00 – 18:00", salesThisMonth: 241900, email: "esther@samulbikers.co.ke" },
  { id: "stf-07", name: "Brian Kiplagat", role: "Manager", branchId: "br-03", status: "Active", shift: "08:00 – 17:00", salesThisMonth: 129400, email: "brian.k@samulbikers.co.ke" },
];

export const sampleBranches: Branch[] = [
  { id: "br-01", name: "Main branch", city: "Nairobi", address: "Kirinyaga Road, Stall 14", manager: "Miriam Wambui", phone: "+254 720 000 114", staff: 4, monthlyRevenue: 1206420, stockValue: 2840000, status: "Open" },
  { id: "br-02", name: "Ngara workshop", city: "Nairobi", address: "Park Road, Unit 6", manager: "Esther Njoki", phone: "+254 733 400 280", staff: 2, monthlyRevenue: 486300, stockValue: 1120000, status: "Open" },
  { id: "br-03", name: "Nakuru outlet", city: "Nakuru", address: "Kenyatta Avenue, Shop 3", manager: "Brian Kiplagat", phone: "+254 711 900 337", staff: 1, monthlyRevenue: 214800, stockValue: 690000, status: "Closing soon" },
];
