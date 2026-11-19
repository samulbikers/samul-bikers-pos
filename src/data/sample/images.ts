import accessoriesImage from "@/assets/cat-accessories.jpg";
import safetyImage from "@/assets/cat-safety-gear.jpg";
import tailboxImage from "@/assets/cat-tailboxes.jpg";

export type ProductCategory = "Riding gear" | "Tail boxes" | "Accessories" | "Safety gear";

export const categoryImages: Record<ProductCategory, string> = {
  "Riding gear": tailboxImage,
  "Tail boxes": tailboxImage,
  Accessories: accessoriesImage,
  "Safety gear": safetyImage,
};

export const categoryAltText: Record<ProductCategory, string> = {
  "Riding gear": "Motorcycle riding jacket and protective apparel",
  "Tail boxes": "Lockable motorcycle touring tail box",
  Accessories: "Motorcycle accessories on a workshop bench",
  "Safety gear": "Helmet and protective motorcycle gloves",
};
