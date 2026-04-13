"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronUp, ChevronDown, Plus, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

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

type EditingField = { categoryId: string; field: "name" | "description" };

export default function CategoriesPage() {
  const { session, updateSession } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingInline, setSavingInline] = useState(false);

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

  function getProductCount(categoryId: string) {
    return allProducts.filter(p => p.category?.id === categoryId).length;
  }

  async function handleCreate() {
    if (!session || !createForm.name.trim()) return;
    setCreating(true);
    try {
      const slug = createForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await withAdminSession(session, (token) =>
        apiFetch("/catalog/categories", {
          method: "POST",
          body: JSON.stringify({
            name: createForm.name,
            slug,
            description: createForm.description || undefined,
            sortOrder: categories.length,
            isVisible: true,
            locationCode: "main",
          }),
        }, token), updateSession
      );
      toast.success("Category created");
      setCreateForm({ name: "", description: "" });
      setShowCreate(false);
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleInlineEdit(categoryId: string, field: "name" | "description", value: string) {
    if (!session) return;
    if (field === "name" && !value.trim()) {
      toast.error("Category name cannot be empty");
      setEditingField(null);
      return;
    }
    setSavingInline(true);
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/categories/${categoryId}`, {
          method: "PATCH",
          body: JSON.stringify({ [field]: value }),
        }, token), updateSession
      );
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
      setEditingField(null);
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingInline(false);
    }
  }

  async function toggleVisibility(cat: Category) {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/categories/${cat.id}`, {
          method: "PATCH",
          body: JSON.stringify({ isVisible: !cat.isVisible }),
        }, token), updateSession
      );
      toast.success(cat.isVisible ? "Category hidden" : "Category visible");
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function moveCategory(cat: Category, direction: "up" | "down") {
    if (!session) return;
    const currentOrder = cat.sortOrder;
    const swapWith = categories.find(c =>
      direction === "up" ? c.sortOrder === currentOrder - 1 : c.sortOrder === currentOrder + 1
    );
    if (!swapWith) return;
    try {
      await withAdminSession(session, async (token) => {
        await Promise.all([
          apiFetch(`/catalog/categories/${cat.id}`, {
            method: "PATCH",
            body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
          }, token),
          apiFetch(`/catalog/categories/${swapWith.id}`, {
            method: "PATCH",
            body: JSON.stringify({ sortOrder: currentOrder }),
          }, token),
        ]);
      }, updateSession);
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    }
  }

  function startEditing(catId: string, field: "name" | "description", currentValue: string) {
    setEditingField({ categoryId: catId, field });
    setEditValue(currentValue);
  }

  function cancelEditing() {
    setEditingField(null);
    setEditValue("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your menu categories, reorder, and assign products.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" /> New Category
        </Button>
      </div>

      {/* Inline Create Form */}
      {showCreate && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create New Category</CardTitle>
            <CardDescription>Enter a name and optional description. The slug is auto-generated from the name.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g. Starters"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter" && createForm.name.trim()) handleCreate(); }}
                  autoFocus
                />
              </div>
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter" && createForm.name.trim()) handleCreate(); }}
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={handleCreate} disabled={!createForm.name.trim() || creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Create
                </Button>
                <Button variant="ghost" onClick={() => { setShowCreate(false); setCreateForm({ name: "", description: "" }); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="pt-4 text-sm text-amber-400">
            {error}
            <Button variant="outline" size="sm" className="ml-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={loadData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && categories.length === 0 && !error && (
        <EmptyState
          icon={FolderOpen}
          title="No categories yet"
          description="Create your first menu category to organize your products."
          action={{ label: "Create Category", onClick: () => setShowCreate(true) }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const productCount = getProductCount(cat.id);
          const isEditingName = editingField?.categoryId === cat.id && editingField.field === "name";
          const isEditingDesc = editingField?.categoryId === cat.id && editingField.field === "description";

          return (
            <Card key={cat.id} className={!cat.isVisible ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {isEditingName ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleInlineEdit(cat.id, "name", editValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleInlineEdit(cat.id, "name", editValue);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        autoFocus
                        disabled={savingInline}
                        className="text-base font-semibold h-8"
                      />
                    ) : (
                      <CardTitle
                        className="text-base cursor-pointer hover:text-primary transition-colors truncate"
                        onClick={() => startEditing(cat.id, "name", cat.name)}
                        title="Click to edit name"
                      >
                        {cat.name}
                      </CardTitle>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCategory(cat, "up")} disabled={cat.sortOrder === 0} aria-label="Move up">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCategory(cat, "down")} disabled={cat.sortOrder === categories.length - 1} aria-label="Move down">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {isEditingDesc ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleInlineEdit(cat.id, "description", editValue)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInlineEdit(cat.id, "description", editValue);
                      if (e.key === "Escape") cancelEditing();
                    }}
                    autoFocus
                    disabled={savingInline}
                    className="text-sm h-7 mt-1"
                    placeholder="Add a description..."
                  />
                ) : (
                  <CardDescription
                    className="cursor-pointer hover:text-primary transition-colors mt-1 line-clamp-2"
                    onClick={() => startEditing(cat.id, "description", cat.description || "")}
                    title="Click to edit description"
                  >
                    {cat.description || "Click to add description"}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={cat.isVisible ? "default" : "secondary"}>
                      {cat.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {productCount} product{productCount !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-mono">
                      {cat.slug}
                    </Badge>
                  </div>
                  <Switch
                    checked={cat.isVisible}
                    onCheckedChange={() => toggleVisibility(cat)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}