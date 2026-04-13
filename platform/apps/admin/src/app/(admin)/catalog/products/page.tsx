"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, RotateCcw, Search, Pencil, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Category = { id: string; slug: string; name: string };
type Product = {
  id: string; slug: string; name: string; shortDescription?: string;
  imageUrl?: string; isFeatured: boolean; status: string; sortOrder: number;
  variants: { id: string; name: string; priceAmount: number }[];
  category?: { id: string; name: string; slug?: string };
  modifierGroups: unknown[];
};

const sampleCategories: Category[] = [
  { id: "9396f01f-1808-411b-8f67-b2852b10469c", slug: "meal-deals", name: "Meal Deals" },
  { id: "5a7e091c-f422-4be7-a3bd-c42043c65179", slug: "originals", name: "Originals" },
  { id: "58608fa6-dc70-4776-9353-91b41b2b428a", slug: "smoothies", name: "Smoothies" },
  { id: "686c0234-59bd-421d-9df0-ecc5c4c07e00", slug: "milkshakes", name: "Milkshakes" },
  { id: "d6557785-e0e5-4cd5-8cf5-f54bd95e53e7", slug: "drinks-and-coffees", name: "Drinks & Coffees" },
  { id: "1a462893-c73e-4b8c-9741-b6a561488155", slug: "snacks-and-sweets", name: "Snacks & Sweets" },
];

const sampleProducts: Product[] = [
  { id: "30c869b9", slug: "option-1", name: "Option 1", shortDescription: "Premium sandwich, canned drink, chocolate, and crisps.", isFeatured: true, status: "active", sortOrder: 0, variants: [{ id: "v1", name: "Default", priceAmount: 9.95 }], category: { id: "9396f01f-1808-411b-8f67-b2852b10469c", name: "Meal Deals" }, modifierGroups: [] },
  { id: "9bd0c85e", slug: "option-2", name: "Option 2", shortDescription: "Deluxe sandwich, canned drink, and two snack items.", isFeatured: false, status: "active", sortOrder: 1, variants: [{ id: "v2", name: "Default", priceAmount: 13.95 }], category: { id: "9396f01f-1808-411b-8f67-b2852b10469c", name: "Meal Deals" }, modifierGroups: [] },
  { id: "9d55898a", slug: "tuckinn-proper-original", name: "Tuckinn Proper Original", shortDescription: "House signature sandwich with full custom build options.", isFeatured: true, status: "active", sortOrder: 4, variants: [{ id: "v5", name: "Default", priceAmount: 9.95 }], category: { id: "5a7e091c-f422-4be7-a3bd-c42043c65179", name: "Originals" }, modifierGroups: [] },
  { id: "3e5619ac", slug: "build-your-own-sandwich", name: "Build Your Own Sandwich", shortDescription: "Start with the base build and make it your own.", isFeatured: true, status: "active", sortOrder: 5, variants: [{ id: "v6", name: "Default", priceAmount: 6.45 }], category: { id: "5a7e091c-f422-4be7-a3bd-c42043c65179", name: "Originals" }, modifierGroups: [] },
  { id: "10942dde", slug: "tropical-escape", name: "Tropical Escape", shortDescription: "Mango, pineapple, coconut water, and lime.", isFeatured: false, status: "active", sortOrder: 7, variants: [{ id: "v8", name: "Default", priceAmount: 4.95 }], category: { id: "58608fa6-dc70-4776-9353-91b41b2b428a", name: "Smoothies" }, modifierGroups: [] },
  { id: "a76d8598", slug: "chocolate-milkshake", name: "Chocolate Milkshake", shortDescription: "Thick and creamy chocolate shake.", isFeatured: false, status: "active", sortOrder: 8, variants: [{ id: "v9", name: "Default", priceAmount: 4.45 }], category: { id: "686c0234-59bd-421d-9df0-ecc5c4c07e00", name: "Milkshakes" }, modifierGroups: [] },
  { id: "bf2e3f4c", slug: "cappuccino", name: "Cappuccino", shortDescription: "Frothy and rich coffee shop standard.", isFeatured: false, status: "active", sortOrder: 10, variants: [{ id: "v11", name: "Default", priceAmount: 3.25 }], category: { id: "d6557785-e0e5-4cd5-8cf5-f54bd95e53e7", name: "Drinks & Coffees" }, modifierGroups: [] },
  { id: "062d9084", slug: "crisps", name: "Crisps", shortDescription: "Assorted flavours for lunch add-ons.", isFeatured: false, status: "active", sortOrder: 11, variants: [{ id: "v12", name: "Default", priceAmount: 1.50 }], category: { id: "1a462893-c73e-4b8c-9741-b6a561488155", name: "Snacks & Sweets" }, modifierGroups: [] },
];

export default function ProductsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        apiFetch<Product[]>("/catalog/products?locationCode=main", undefined, session?.accessToken),
        apiFetch<Category[]>("/catalog/categories?locationCode=main", undefined, session?.accessToken),
      ]);
      setAllProducts(prods);
      setCategories(cats);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load products";
      if (msg.includes("401")) {
        setError("Login required to manage products.");
        setAllProducts(sampleProducts);
        setCategories(sampleCategories);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, [session]);

  useEffect(() => {
    let list = [...allProducts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.shortDescription || "").toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") list = list.filter(p => p.category?.id === categoryFilter);
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    setFiltered(list);
  }, [searchQuery, categoryFilter, statusFilter, allProducts]);

  async function archiveProduct(id: string) {
    try {
      await apiFetch(`/catalog/products/${id}/archive`, { method: "PATCH" }, session?.accessToken);
      toast.success("Product archived");
      loadProducts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Archive failed"); }
  }

  async function restoreProduct(id: string) {
    try {
      await apiFetch(`/catalog/products/${id}/restore`, { method: "PATCH" }, session?.accessToken);
      toast.success("Product restored");
      loadProducts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Restore failed"); }
  }

  function formatPrice(amount: number) { return `€${Number(amount).toFixed(2)}`; }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">{allProducts.length} products · {filtered.length} shown</p>
        </div>
        <Button onClick={() => router.push("/catalog/products/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-1">
          {(["all", "active", "archived"] as const).map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && <Card className="border-amber-200 bg-amber-50"><CardContent className="pt-4 text-sm text-amber-800">⚠️ {error}</CardContent></Card>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products found.</TableCell></TableRow>
              ) : (
                filtered.map(prod => (
                  <TableRow key={prod.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/catalog/products/${prod.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="h-10 w-10 rounded object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">📷</div>
                        )}
                        <div>
                          <span className="font-medium">{prod.name}</span>
                          {prod.isFeatured && <Badge variant="secondary" className="ml-2 text-xs">Featured</Badge>}
                          {prod.shortDescription && <p className="text-xs text-muted-foreground line-clamp-1">{prod.shortDescription}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{prod.category?.name || "—"}</Badge></TableCell>
                    <TableCell className="text-sm">{prod.variants?.length || 1}</TableCell>
                    <TableCell className="font-medium">{prod.variants?.[0] ? formatPrice(prod.variants[0].priceAmount) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={prod.status === "active" ? "default" : "secondary"}>{prod.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/catalog/products/${prod.id}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                      {prod.status === "active" ? (
                        <Button variant="ghost" size="sm" onClick={() => archiveProduct(prod.id)}><Archive className="h-3.5 w-3.5" /></Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => restoreProduct(prod.id)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}