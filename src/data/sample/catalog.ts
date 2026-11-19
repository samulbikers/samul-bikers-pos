import type { ProductCategory } from "@/data/sample/images";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  unitsSold: number;
  supplierId: string;
};

export type CategorySummary = {
  name: ProductCategory;
  description: string;
  products: number;
  revenue: number;
  margin: number;
};

export const sampleProducts: Product[] = [
  { id: "p-01", name: "Full-face riding helmet", sku: "GEAR-0142", category: "Safety gear", price: 12500, cost: 7900, stock: 3, reorderLevel: 6, unitsSold: 42, supplierId: "sup-01" },
  { id: "p-02", name: "Lockable touring tail box", sku: "STOR-0078", category: "Tail boxes", price: 9800, cost: 6100, stock: 5, reorderLevel: 8, unitsSold: 57, supplierId: "sup-02" },
  { id: "p-03", name: "Waterproof riding gloves", sku: "GEAR-0195", category: "Safety gear", price: 3200, cost: 1750, stock: 2, reorderLevel: 10, unitsSold: 88, supplierId: "sup-01" },
  { id: "p-04", name: "Armoured riding jacket", sku: "GEAR-0210", category: "Riding gear", price: 17500, cost: 11200, stock: 12, reorderLevel: 5, unitsSold: 31, supplierId: "sup-03" },
  { id: "p-05", name: "Touring windscreen", sku: "ACC-0311", category: "Accessories", price: 7400, cost: 4300, stock: 9, reorderLevel: 4, unitsSold: 22, supplierId: "sup-02" },
  { id: "p-06", name: "Phone mount with charger", sku: "ACC-0128", category: "Accessories", price: 2850, cost: 1400, stock: 34, reorderLevel: 12, unitsSold: 121, supplierId: "sup-04" },
  { id: "p-07", name: "Reflective rain suit", sku: "GEAR-0288", category: "Riding gear", price: 6400, cost: 3700, stock: 17, reorderLevel: 6, unitsSold: 26, supplierId: "sup-03" },
  { id: "p-08", name: "Aluminium pannier set", sku: "STOR-0134", category: "Tail boxes", price: 24800, cost: 16800, stock: 4, reorderLevel: 3, unitsSold: 9, supplierId: "sup-02" },
  { id: "p-09", name: "Knee and shin guards", sku: "GEAR-0177", category: "Safety gear", price: 4100, cost: 2200, stock: 21, reorderLevel: 8, unitsSold: 64, supplierId: "sup-01" },
  { id: "p-10", name: "Handlebar phone cradle", sku: "ACC-0202", category: "Accessories", price: 1900, cost: 900, stock: 41, reorderLevel: 15, unitsSold: 143, supplierId: "sup-04" },
  { id: "p-11", name: "Tank bag with rain cover", sku: "STOR-0221", category: "Tail boxes", price: 5600, cost: 3200, stock: 14, reorderLevel: 6, unitsSold: 37, supplierId: "sup-02" },
  { id: "p-12", name: "Chain lube and brush kit", sku: "ACC-0165", category: "Accessories", price: 1450, cost: 620, stock: 62, reorderLevel: 20, unitsSold: 208, supplierId: "sup-04" },
  { id: "p-13", name: "Riding boots, reinforced", sku: "GEAR-0304", category: "Riding gear", price: 8900, cost: 5400, stock: 8, reorderLevel: 5, unitsSold: 19, supplierId: "sup-03" },
  { id: "p-14", name: "High-visibility vest", sku: "GEAR-0119", category: "Safety gear", price: 1650, cost: 780, stock: 46, reorderLevel: 15, unitsSold: 96, supplierId: "sup-01" },
  { id: "p-15", name: "Top-box luggage liner", sku: "STOR-0190", category: "Tail boxes", price: 2300, cost: 1150, stock: 27, reorderLevel: 10, unitsSold: 52, supplierId: "sup-02" },
  { id: "p-16", name: "LED auxiliary lamp pair", sku: "ACC-0342", category: "Accessories", price: 4300, cost: 2400, stock: 11, reorderLevel: 6, unitsSold: 28, supplierId: "sup-04" },
];

export const sampleCategories: CategorySummary[] = [
  { name: "Riding gear", description: "Jackets, suits and boots for daily commutes and touring.", products: 4, revenue: 147620, margin: 36 },
  { name: "Tail boxes", description: "Lockable storage, panniers and luggage systems.", products: 5, revenue: 104330, margin: 31 },
  { name: "Accessories", description: "Mounts, lighting, care kits and everyday add-ons.", products: 4, revenue: 85020, margin: 47 },
  { name: "Safety gear", description: "Helmets, gloves, guards and visibility wear.", products: 3, revenue: 49450, margin: 39 },
];

export function productById(id: string) {
  return sampleProducts.find((product) => product.id === id);
}

export function stockStatus(product: Product): "Out of stock" | "Low stock" | "In stock" {
  if (product.stock === 0) return "Out of stock";
  if (product.stock <= product.reorderLevel) return "Low stock";
  return "In stock";
}
