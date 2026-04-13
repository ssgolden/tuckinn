"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronUp, ChevronDown, FolderOpen, Pencil, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Category = {
  id: string; slug: string; name: string; description?: string;
  sortOrder: number; isVisible: boolean; createdAt: string;
};

type Product = {
  id: string; slug: string; name: string; shortDescription?: string;
  imageUrl?: string; isFeatured: boolean; status: string; sortOrder: number;
  variants: { id: string; name: string; priceAmount: number }[];
  category?: { id: string; name: string; slug?: string };
  modifierGroups: unknown[];
};

export default function CategoriesPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", sortOrder: 0, isVisible: true,
  });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        apiFetch<Category[]>("/catalog/categories?locationCode=main", undefined, session?.accessToken),
        apiFetch<Product[]>("/catalog/products?locationCode=main", undefined, session?.accessToken),
      ]);
      setCategories(cats);
      setAllProducts(prods);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load data";
      if (msg.includes("401")) {
        setError("Login required to manage categories.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [session]);

  function getProductsForCategory(slug: string) {
    return allProducts.filter(p => p.category?.id === slug);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", sortOrder: 0, isVisible: true });
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: cat.sortOrder, isVisible: cat.isVisible });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      if (editing) {
        await apiFetch(`/catalog/categories/${editing.id}`, {
          method: "PATCH", body: JSON.stringify(form),
        }, session?.accessToken);
        toast.success("Category updated");
      } else {
        await apiFetch("/catalog/categories", {
          method: "POST", body: JSON.stringify({ ...form, locationCode: "main" }),
        }, session?.accessToken);
        toast.success("Category created");
      }
      setDialogOpen(false);
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function toggleVisibility(cat: Category) {
    try {
      await apiFetch(`/catalog/categories/${cat.id}`, {
        method: "PATCH", body: JSON.stringify({ isVisible: !cat.isVisible }),
      }, session?.accessToken);
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function moveCategory(cat: Category, direction: "up" | "down") {
    const currentOrder = cat.sortOrder;
    const swapWith = categories.find(c =>
      direction === "up" ? c.sortOrder === currentOrder - 1 : c.sortOrder === currentOrder + 1
    );
    if (!swapWith) return;
    try {
      await Promise.all([
        apiFetch(`/catalog/categories/${cat.id}`, {
          method: "PATCH", body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
        }, session?.accessToken),
        apiFetch(`/catalog/categories/${swapWith.id}`, {
          method: "PATCH", body: JSON.stringify({ sortOrder: currentOrder }),
        }, session?.accessToken),
      ]);
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    }
  }

  function formatPrice(amount: number) {
    return `€${Number(amount).toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your menu categories, reorder, and assign products.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Category
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
              <DialogDescription>{editing ? "Update category details." : "Add a new menu category."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} placeholder="e.g. Starters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. starters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Visible</Label>
                <Switch checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Sort Order</Label>
                <Input id="sort" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!form.name || !form.slug}>
                {editing ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-800">⚠️ {error}</CardContent>
        </Card>
      )}

      {categories.map((cat) => {
        const products = getProductsForCategory(cat.slug);
        const isExpanded = expandedCategory === cat.id;

        return (
          <Card key={cat.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderOpen className="h-4 w-4" />
                    {cat.name}
                  </CardTitle>
                  <Badge variant={cat.isVisible ? "default" : "secondary"}>{cat.isVisible ? "Visible" : "Hidden"}</Badge>
                  <Badge variant="outline" className="text-xs font-mono">{cat.slug}</Badge>
                  <Badge variant="outline" className="text-xs">{products.length} product{products.length !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisibility(cat)}>
                    {cat.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveCategory(cat, "up")} disabled={cat.sortOrder === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveCategory(cat, "down")} disabled={cat.sortOrder === categories.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}>
                    {isExpanded ? "Hide Products" : "Show Products"}
                  </Button>
                </div>
              </div>
              {cat.description && <CardDescription>{cat.description}</CardDescription>}
            </CardHeader>

            {isExpanded && (
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No products in this category yet.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push("/catalog/products/new")}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Product
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Product</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((prod) => (
                        <TableRow key={prod.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/catalog/products/${prod.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} className="h-8 w-8 rounded object-cover border" />
                              ) : (
                                <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center text-[10px]">📷</div>
                              )}
                              <span className="font-medium">{prod.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{prod.variants?.[0]?.name || "Default"}</TableCell>
                          <TableCell className="font-medium">{prod.variants?.[0] ? formatPrice(prod.variants[0].priceAmount) : "—"}</TableCell>
                          <TableCell><Badge variant={prod.status === "active" ? "default" : "secondary"}>{prod.status}</Badge></TableCell>
                          <TableCell>{prod.isFeatured ? "⭐" : ""}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/catalog/products/${prod.id}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}