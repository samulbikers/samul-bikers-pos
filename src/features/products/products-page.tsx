import { Boxes, Layers, Pencil, Percent, Plus, ShoppingBag, Tags, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, FormDialog, type FormField, type FormValues } from "@/components/data/form-dialog";
import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts, type CatalogProduct } from "@/lib/supabase/queries";
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProductDetails,
} from "@/lib/supabase/mutations";
import type { DbProduct } from "@/lib/supabase/types";
import { formatKes, formatPercent } from "@/lib/format";

const stockOptions = ["All stock levels", "In stock", "Low stock", "Out of stock"] as const;
const statusOptions: DbProduct["stock_status"][] = ["in_stock", "out_of_stock", "available_on_order"];

function stockState(product: CatalogProduct) {
  if (product.stock <= 0) return "Out of stock";
  if (product.stock <= product.reorderLevel) return "Low stock";
  return "In stock";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const emptyValues: FormValues = {
  title: "",
  sku: "",
  category_id: "",
  price: "",
  cost_price: "",
  stock_quantity: "0",
  reorder_level: "5",
  short_description: "",
  description: "",
  image_url: "",
  is_featured: "No",
  show_price: "Yes",
  stock_status: "in_stock",
};

export function ProductsPage() {
  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProductDetails();
  const deleteProduct = useDeleteProduct();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stock, setStock] = useState<string>(stockOptions[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [deleting, setDeleting] = useState<CatalogProduct | null>(null);

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const categoryOptions = useMemo(
    () => ["All categories", ...Array.from(new Set(products.map((product) => product.categoryName))).sort()],
    [products],
  );

  const fields = useMemo<readonly FormField[]>(
    () => [
      { key: "title", label: "Product name", full: true, placeholder: "e.g. 45L Aluminium top box" },
      { key: "sku", label: "SKU / barcode", placeholder: "SB-0045" },
      {
        key: "category_id",
        label: "Category",
        type: "select",
        options: [{ value: "", label: "Uncategorised" }, ...categories.map((entry) => ({ value: entry.id, label: entry.name }))],
      },
      { key: "price", label: "Retail price (KES)", type: "number", step: "0.01" },
      { key: "cost_price", label: "Cost price (KES)", type: "number", step: "0.01" },
      { key: "stock_quantity", label: "Stock on hand", type: "number" },
      { key: "reorder_level", label: "Reorder level", type: "number" },
      {
        key: "stock_status",
        label: "Website availability",
        type: "select",
        options: [
          { value: "in_stock", label: "In stock" },
          { value: "out_of_stock", label: "Out of stock" },
          { value: "available_on_order", label: "Available on order" },
        ],
      },
      { key: "image_url", label: "Image URL", type: "url", full: true, placeholder: "https://..." },
      { key: "short_description", label: "Short description", type: "textarea", full: true },
      { key: "description", label: "Full description", type: "textarea", full: true },
      {
        key: "show_price",
        label: "Show price on website",
        type: "select",
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
      },
      {
        key: "is_featured",
        label: "Featured on website",
        type: "select",
        options: [
          { value: "No", label: "No" },
          { value: "Yes", label: "Yes" },
        ],
      },
    ],
    [categories],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !needle || `${product.title} ${product.sku}`.toLowerCase().includes(needle);
      const matchesCategory = category === "All categories" || product.categoryName === category;
      const matchesStock = stock === stockOptions[0] || stockState(product) === stock;
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, category, stock]);

  const stockValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const lowStock = products.filter((product) => stockState(product) !== "In stock").length;
  const priced = products.filter((product) => product.margin !== null);
  const averageMargin = priced.length
    ? priced.reduce((sum, product) => sum + (product.margin ?? 0), 0) / priced.length
    : null;

  const change = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setValues({
      ...emptyValues,
      category_id: categories[0]?.id ?? "",
      sku: `SB-${Date.now().toString().slice(-6)}`,
    });
    setDialogOpen(true);
  };

  const openEdit = (product: CatalogProduct) => {
    setEditing(product);
    setValues({
      title: product.title,
      sku: product.sku,
      category_id: product.categoryId ?? "",
      price: String(product.price),
      cost_price: product.cost === null ? "" : String(product.cost),
      stock_quantity: String(product.stock),
      reorder_level: String(product.reorderLevel),
      short_description: product.shortDescription,
      description: product.description,
      image_url: product.image ?? "",
      is_featured: product.isFeatured ? "Yes" : "No",
      show_price: "Yes",
      stock_status: product.stockStatus,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!values["title"]?.trim() || !values["price"]) {
      toast.error("Product name and retail price are required");
      return;
    }

    const image = values["image_url"]?.trim();
    const stockQuantity = Number(values["stock_quantity"] || 0);
    const stockStatus = (values["stock_status"] || "in_stock") as DbProduct["stock_status"];
    const payload = {
      title: values["title"].trim(),
      slug: slugify(values["title"]),
      description: values["description"]?.trim() || "",
      short_description: values["short_description"]?.trim() || "",
      category_id: values["category_id"] || null,
      images: image ? [image] : [],
      price: Number(values["price"]),
      show_price: values["show_price"] !== "No",
      has_discount: false,
      discount_price: null,
      stock_status: stockQuantity <= 0 && stockStatus === "in_stock" ? "out_of_stock" : stockStatus,
      stock_quantity: stockQuantity,
      cost_price: values["cost_price"] ? Number(values["cost_price"]) : null,
      reorder_level: Number(values["reorder_level"] || 5),
      sku: values["sku"]?.trim() || null,
      is_featured: values["is_featured"] === "Yes",
    };

    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, ...payload });
        toast.success("Product updated", { description: `${payload.title} is live on the POS and website.` });
      } else {
        await createProduct.mutateAsync(payload);
        toast.success("Product added", { description: `${payload.title} is now live on the POS and website.` });
      }
      setDialogOpen(false);
      setEditing(null);
      setValues(emptyValues);
    } catch (error) {
      toast.error("Could not save the product", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct.mutateAsync(deleting.id);
      toast.success("Product deleted", { description: `${deleting.title} removed from the catalogue.` });
      setDeleting(null);
    } catch (error) {
      toast.error("Could not delete the product", {
        description:
          error instanceof Error
            ? `${error.message}. Products with sales history cannot be deleted — set stock to 0 instead.`
            : "Unexpected error",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Live catalogue shared with the shop website, with stock, cost and margin."
        meta={
          productsQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Published to website
            </span>
          ) : null
        }
        actions={
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-3.5" />
            Add product
          </Button>
        }
      />

      <SupabaseNotice />
      {productsQuery.isError && <QueryError error={productsQuery.error} label="Could not load products" />}

      <section aria-label="Product summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={ShoppingBag} title="Catalogue size" value={String(products.length)} note="live products" color="var(--chart-1)" />
        <StatCard icon={Boxes} title="Stock value" value={formatKes(stockValue)} note="retail price × units" color="var(--chart-2)" />
        <StatCard icon={Tags} title="Needs attention" value={String(lowStock)} note="low or out of stock" color="var(--chart-4)" />
        <StatCard
          icon={Percent}
          title="Average margin"
          value={averageMargin === null ? "—" : formatPercent(averageMargin, 1)}
          note={averageMargin === null ? "add cost prices to see margins" : "sample cost basis"}
          color="var(--chart-3)"
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Product catalogue</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Changes save to Supabase and publish straight to the shop website.
          </p>
        </div>
        <Toolbar>
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search products"
            placeholder="Search product or SKU"
            className="w-full sm:w-64"
          />
          <FilterSelect label="Filter by category" value={category} onChange={setCategory} options={categoryOptions} />
          <FilterSelect label="Filter by stock level" value={stock} onChange={setStock} options={stockOptions} />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Layers aria-hidden="true" className="size-3" />
            {rows.length} shown
          </span>
        </Toolbar>

        {productsQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading products..." />
          </div>
        ) : !products.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No products yet"
              description="Add your first product to publish it to the POS and the website."
              action={
                <Button type="button" size="sm" className="mt-2 h-8" onClick={openCreate}>
                  Add product
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(product) => product.id}
            emptyMessage="No products match these filters."
            caption="Product catalogue"
            minWidth="980px"
            columns={[
              {
                key: "product",
                header: "PRODUCT",
                render: (product) => (
                  <span className="flex items-center gap-2.5">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="size-9 shrink-0 rounded-md border border-border object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                        <ShoppingBag aria-hidden="true" className="size-3.5" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="block max-w-[210px] truncate text-left font-medium text-primary hover:underline"
                      >
                        {product.title}
                      </button>
                      <span className="block text-[10px] text-muted-foreground">{product.sku}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: "category",
                header: "CATEGORY",
                render: (product) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{product.categoryName}</span>
                ),
              },
              {
                key: "price",
                header: "PRICE",
                align: "right",
                render: (product) => (
                  <span className="whitespace-nowrap font-semibold">{formatKes(product.price)}</span>
                ),
              },
              {
                key: "cost",
                header: "COST",
                align: "right",
                render: (product) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                    {product.cost === null ? "—" : formatKes(product.cost)}
                  </span>
                ),
              },
              {
                key: "margin",
                header: "MARGIN",
                align: "right",
                render: (product) =>
                  product.margin === null ? (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  ) : (
                    <span className="whitespace-nowrap text-emerald">{formatPercent(product.margin, 1)}</span>
                  ),
              },
              {
                key: "stock",
                header: "STOCK",
                align: "right",
                render: (product) => (
                  <span className="whitespace-nowrap">
                    <span className="font-semibold">{product.stock}</span>
                    <span className="text-[10px] text-muted-foreground"> units</span>
                  </span>
                ),
              },
              {
                key: "status",
                header: "STATUS",
                align: "right",
                render: (product) => <StatusBadge status={stockState(product)} />,
              },
              {
                key: "actions",
                header: "ACTIONS",
                align: "right",
                render: (product) => (
                  <span className="flex items-center justify-end gap-1">
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[10px]" onClick={() => openEdit(product)}>
                      <Pencil aria-hidden="true" className="size-3" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px] text-destructive"
                      onClick={() => setDeleting(product)}
                    >
                      <Trash2 aria-hidden="true" className="size-3" />
                      Delete
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        )}
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Catalogue is shared with the shop website · Every change is saved to Supabase
        </div>
      </section>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Update product" : "Add product"}
        description="Saved to the products table in Supabase and published to the website."
        fields={fields}
        values={values}
        onChange={change}
        onSubmit={submit}
        pending={createProduct.isPending || updateProduct.isPending}
        submitLabel={editing ? "Save changes" : "Publish product"}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete product?"
        description={`Remove ${deleting?.title ?? "this product"} from the POS and the website? This cannot be undone.`}
        pending={deleteProduct.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
