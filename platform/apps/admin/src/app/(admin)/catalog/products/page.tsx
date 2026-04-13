"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Archive, RotateCcw, Search, Pencil, Plus, Package, AlertTriangle, Image as ImageIcon, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";

type Category = { id: string; slug: string; name: string };
type Product = {
  id: string; slug: string; name: string; shortDescription?: string;
  imageUrl?: string; isFeatured: boolean; status: string; sortOrder: number;
  variants: { id: string; name: string; priceAmount: number }[];
  category?: { id: string; name: string; slug?: string };
  modifierGroups: unknown[];
  createdAt?: string;
};

type SortField = "name" | "price" | "date";

export default function ProductsPage() {
  const { session, updateSession } = useAuth();
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Confirm dialogs
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

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

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "price") cmp = (a.variants?.[0]?.priceAmount ?? 0) - (b.variants?.[0]?.priceAmount ?? 0);
      else if (sortField === "date") cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "desc" ? -cmp : cmp;
    });

    setFiltered(list);
  }, [searchQuery, categoryFilter, statusFilter, sortField, sortDir, allProducts]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, categoryFilter, statusFilter, sortField, sortDir]);

  async function archiveProduct(id: string) {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/products/${id}/archive`, { method: "PATCH" }, token), updateSession
      );
      toast.success("Product archived");
      loadProducts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Archive failed"); }
  }

  async function restoreProduct(id: string) {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/products/${id}/restore`, { method: "PATCH" }, token), updateSession
      );
      toast.success("Product restored");
      loadProducts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Restore failed"); }
  }

  async function deleteProduct(id: string) {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/products/${id}`, { method: "DELETE" }, token), updateSession
      );
      toast.success("Product deleted");
      loadProducts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
  }

  function formatPrice(amount: number) { return `€${Number(amount).toFixed(2)}`; }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

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
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="min-w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="min-w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="date">Date Created</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          title={sortDir === "asc" ? "Sort ascending" : "Sort descending"}
        >
          {sortDir === "asc" ? "A-Z" : "Z-A"}
        </Button>
        <div className="flex gap-1">
          {(["all", "active", "archived"] as const).map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && <Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="pt-4 text-sm text-amber-400"><AlertTriangle className="h-4 w-4 inline mr-1.5 align-text-bottom" />{error} <Button variant="outline" size="sm" className="ml-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={loadProducts}>Retry</Button></CardContent></Card>}

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
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">Loading...</TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-2">
                  <EmptyState
                    icon={Package}
                    title="No products found"
                    description={searchQuery ? "Try adjusting your search query." : "Create your first product to get started."}
                    action={!searchQuery ? { label: "New Product", onClick: () => router.push("/catalog/products/new") } : undefined}
                  />
                </TableCell></TableRow>
              ) : (
                paginated.map(prod => (
                  <TableRow key={prod.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/catalog/products/${prod.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="h-10 w-10 rounded object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
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
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/catalog/products/${prod.id}`)} aria-label={`Edit ${prod.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      {prod.status === "active" ? (
                        <Button variant="ghost" size="sm" onClick={() => setArchiveTarget(prod)} aria-label={`Archive ${prod.name}`}><Archive className="h-3.5 w-3.5" /></Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => restoreProduct(prod.id)} aria-label={`Restore ${prod.name}`}><RotateCcw className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(prod)} aria-label={`Delete ${prod.name}`} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive confirmation dialog */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
        title="Archive Product"
        description={`Are you sure you want to archive "${archiveTarget?.name}"? This will hide it from the menu. You can restore it later.`}
        confirmLabel="Archive"
        destructive
        onConfirm={() => {
          if (archiveTarget) archiveProduct(archiveTarget.id);
          setArchiveTarget(null);
        }}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Product"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteProduct(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}