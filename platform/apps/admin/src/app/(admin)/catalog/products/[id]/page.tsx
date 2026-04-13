"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, uploadAdminMedia, withAdminSession, type AdminSession, type UploadedMediaAsset } from "@/lib/api";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Archive,
  RotateCcw,
  Trash2,
  Loader2,
  ImageIcon,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ProductStatus = "active" | "draft" | "archived";
type Category = { id: string; slug: string; name: string };
type Variant = { id: string; name: string; priceAmount: number; isDefault: boolean; sku: string | null };
type ModifierGroup = {
  id: string; name: string; description?: string; minSelect: number; maxSelect: number;
  isRequired: boolean; sortOrder: number; options: ModifierOption[];
};
type ModifierOption = { id: string; name: string; priceDeltaAmount: number; isDefault: boolean; isActive: boolean; sortOrder: number };
type Product = {
  id: string; slug: string; name: string; shortDescription?: string; longDescription?: string;
  imageUrl?: string; imageAltText?: string; isFeatured: boolean; status: string; sortOrder: number;
  variants: Variant[]; modifierGroups: ModifierGroup[]; category?: Category;
};

export default function ProductDetailPage() {
  const { session, updateSession } = useAuth();
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const isCreate = productId === "new";

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableGroups, setAvailableGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "variants" | "modifiers">("details");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmNavOpen, setConfirmNavOpen] = useState(false);
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", longDescription: "",
    imageUrl: "", imageAltText: "", isFeatured: false, status: "active" as ProductStatus,
    sortOrder: 0, categoryId: "",
  });
  const [variants, setVariants] = useState<Variant[]>([{ id: "", name: "Default", priceAmount: 0, isDefault: true, sku: null }]);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);

  // Track initial form state for dirty detection
  const initialForm = useRef<string>("");
  const initialVariants = useRef<string>("");
  const initialGroupIds = useRef<string>("");

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== initialForm.current
      || JSON.stringify(variants) !== initialVariants.current
      || JSON.stringify(assignedGroupIds) !== initialGroupIds.current;
  }, [form, variants, assignedGroupIds]);

  // beforeunload for browser navigation
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Set initial refs for create mode (empty form)
  useEffect(() => {
    if (isCreate) {
      initialForm.current = JSON.stringify(form);
      initialVariants.current = JSON.stringify(variants);
      initialGroupIds.current = JSON.stringify(assignedGroupIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch<Category[]>("/catalog/categories?locationCode=main", undefined, session?.accessToken)
        .then(setCategories).catch((e) => { console.error("Failed to load categories:", e); }),
      apiFetch<ModifierGroup[]>("/modifiers/groups?locationCode=main", undefined, session?.accessToken)
        .then(setAvailableGroups).catch((e) => { console.error("Failed to load modifier groups:", e); }),
    ]);
    if (!isCreate) {
      // Try single-product endpoint first; fall back to list+filter if API doesn't support it yet
      apiFetch<Product>(`/catalog/products/${productId}`, undefined, session?.accessToken)
        .catch(() => {
          // Fallback: fetch all products and find the one we need
          return apiFetch<Product[]>("/catalog/products?locationCode=main", undefined, session?.accessToken)
            .then((products) => {
              const found = products.find(p => p.id === productId);
              if (!found) throw new Error("Product not found");
              return found;
            });
        })
        .then((p) => {
          setProduct(p);
          const formState = {
            name: p.name, slug: p.slug, shortDescription: p.shortDescription || "",
            longDescription: p.longDescription || "", imageUrl: p.imageUrl || "",
            imageAltText: p.imageAltText || "", isFeatured: p.isFeatured, status: (["active", "draft", "archived"].includes(p.status) ? p.status : "draft") as ProductStatus,
            sortOrder: p.sortOrder, categoryId: p.category?.id || "",
          };
          setForm(formState);
          const vars = p.variants?.length ? p.variants : [{ id: "", name: "Default", priceAmount: 0, isDefault: true, sku: null }];
          setVariants(vars);
          const groupIds = p.modifierGroups?.map(g => g.id) || [];
          setAssignedGroupIds(groupIds);
          // Capture initial state for dirty tracking
          initialForm.current = JSON.stringify(formState);
          initialVariants.current = JSON.stringify(vars);
          initialGroupIds.current = JSON.stringify(groupIds);
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "Failed to load product";
          toast.error(msg);
          console.error("Product load error:", e);
        })
        .finally(() => setLoading(false));
    }
  }, [productId, isCreate, session]);

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      if (isCreate) {
        const created = await withAdminSession(session, (token) =>
          apiFetch<Product>("/catalog/products", {
            method: "POST",
            body: JSON.stringify({
              name: form.name,
              slug: form.slug,
              shortDescription: form.shortDescription,
              longDescription: form.longDescription,
              imageUrl: form.imageUrl || undefined,
              imageAltText: form.imageAltText || undefined,
              isFeatured: form.isFeatured,
              sortOrder: form.sortOrder,
              categoryId: form.categoryId || undefined,
              locationCode: "main",
              variantName: variants[0]?.name || "Default",
              priceAmount: variants[0]?.priceAmount || 0,
            }),
          }, token), updateSession
        );
        toast.success("Product created");
        router.push(`/catalog/products/${created.id}`);
      } else {
        const defaultVariant = variants.find(v => v.isDefault) || variants[0];
        const updateData = {
          name: form.name,
          slug: form.slug,
          shortDescription: form.shortDescription,
          longDescription: form.longDescription,
          imageUrl: form.imageUrl,
          imageAltText: form.imageAltText,
          isFeatured: form.isFeatured,
          status: form.status,
          sortOrder: form.sortOrder,
          categoryId: form.categoryId || null,
          variantName: defaultVariant?.name,
          priceAmount: defaultVariant ? Number(defaultVariant.priceAmount) : undefined,
          sku: defaultVariant?.sku || undefined,
          clearImage: form.imageUrl === "" && !!product?.imageUrl,
        };
        await withAdminSession(session, (token) =>
          apiFetch(`/catalog/products/${productId}`, {
            method: "PATCH", body: JSON.stringify(updateData),
          }, token), updateSession
        );
        toast.success("Product updated");
        // Reset dirty state after successful save
        initialForm.current = JSON.stringify(form);
        initialVariants.current = JSON.stringify(variants);
        initialGroupIds.current = JSON.stringify(assignedGroupIds);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);
    try {
      const asset = await uploadAdminMedia(file, session, updateSession);
      setForm(prev => ({ ...prev, imageUrl: asset.url, imageAltText: file.name }));
      toast.success("Image uploaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleArchive() {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/products/${productId}/archive`, { method: "PATCH" }, token), updateSession
      );
      setForm(prev => ({ ...prev, status: "archived" }));
      toast.success("Product archived");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Archive failed"); }
  }

  async function handleRestore() {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/products/${productId}/restore`, { method: "PATCH" }, token), updateSession
      );
      setForm(prev => ({ ...prev, status: "active" }));
      toast.success("Product restored");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Restore failed"); }
  }

  async function handleDelete() {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/catalog/products/${productId}`, { method: "DELETE" }, token), updateSession
      );
      toast.success("Product deleted");
      router.push("/catalog/products");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
  }

  async function handleAttachGroup(groupId: string) {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch("/modifiers/attach", {
          method: "POST",
          body: JSON.stringify({ locationCode: "main", productSlug: form.slug, modifierGroupId: groupId }),
        }, token), updateSession
      );
      setAssignedGroupIds(prev => [...prev, groupId]);
      toast.success("Modifier group attached");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Attach failed"); }
  }

  async function handleDetachGroup(groupId: string) {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/modifiers/products/${productId}/groups/${groupId}`, { method: "DELETE" }, token), updateSession
      );
      setAssignedGroupIds(prev => prev.filter(id => id !== groupId));
      toast.success("Modifier group detached");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Detach failed"); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusColors: Record<ProductStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-400",
    draft: "bg-yellow-500/10 text-yellow-400",
    archived: "bg-stone-500/10 text-stone-400",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => {
            if (isDirty) { setPendingNavUrl("/catalog/products"); setConfirmNavOpen(true); }
            else router.push("/catalog/products");
          }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isCreate ? "New Product" : form.name || "Untitled Product"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{form.slug || "slug"}</Badge>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[form.status] || "bg-stone-500/10 text-stone-400"}`}>
                {form.status}
              </span>
              {form.isFeatured && <Badge className="bg-amber-500/10 text-amber-400 text-xs">Featured</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCreate && form.status === "active" && (
            <Button variant="outline" size="sm" onClick={handleArchive}><Archive className="h-4 w-4 mr-1" /> Archive</Button>
          )}
          {!isCreate && form.status === "archived" && (
            <Button variant="outline" size="sm" onClick={handleRestore}><RotateCcw className="h-4 w-4 mr-1" /> Restore</Button>
          )}
          {!isCreate && form.status === "archived" && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
          )}
          <Button onClick={handleSave} disabled={saving || !form.name}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {isCreate ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Product details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 border-b">
            {(["details", "variants", "modifiers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "details" && (
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Core information about this product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} placeholder="e.g. Tuckinn Proper Original" />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. tuckinn-proper-original" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.categoryId || "_none"} onValueChange={(v) => setForm({ ...form, categoryId: (v ?? "_none") === "_none" ? "" : (v ?? "") })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">No category</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Brief menu description" />
                </div>
                <div className="space-y-2">
                  <Label>Long Description</Label>
                  <Textarea value={form.longDescription || ""} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} placeholder="Full product details" rows={4} />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                    <Label>Featured</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "variants" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Variants & Pricing</CardTitle>
                    <CardDescription>Manage product variants and prices.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setVariants([...variants, { id: `new-${Date.now()}`, name: "", priceAmount: 0, isDefault: variants.length === 0, sku: null }])}>
                    + Add Variant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <div key={v.id || i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="defaultVariant"
                          checked={v.isDefault}
                          onChange={() => setVariants(variants.map((vv, vi) => ({ ...vv, isDefault: vi === i })))}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-xs text-muted-foreground">Default</span>
                      </label>
                      <Input value={v.name} onChange={(e) => setVariants(variants.map((vv, vi) => vi === i ? { ...vv, name: e.target.value } : vv))} placeholder="Variant name" className="flex-1" />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        <Input type="number" step="0.01" value={v.priceAmount} onChange={(e) => setVariants(variants.map((vv, vi) => vi === i ? { ...vv, priceAmount: parseFloat(e.target.value) || 0 } : vv))} className="pl-7" />
                      </div>
                      {variants.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => setVariants(variants.filter((_, vi) => vi !== i))} aria-label="Remove variant"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "modifiers" && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Modifier Groups</CardTitle>
                  <CardDescription>Attach modifier groups to this product for customisation options.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignedGroupIds.map((groupId) => {
                  const group = availableGroups.find(g => g.id === groupId);
                  return (
                    <div key={groupId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{group?.name || groupId}</p>
                        <p className="text-xs text-muted-foreground">
                          {group ? `Select ${group.minSelect}–${group.maxSelect} · ${group.isRequired ? "Required" : "Optional"} · ${group.options?.length || 0} options` : "Loading..."}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDetachGroup(groupId)} className="text-destructive">Remove</Button>
                    </div>
                  );
                })}
                {availableGroups.filter(g => !assignedGroupIds.includes(g.id)).length > 0 && (
                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground">Add a modifier group</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {availableGroups.filter(g => !assignedGroupIds.includes(g.id)).map(group => (
                        <Button key={group.id} variant="outline" size="sm" onClick={() => handleAttachGroup(group.id)}>
                          + {group.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {assignedGroupIds.length === 0 && availableGroups.filter(g => !assignedGroupIds.includes(g.id)).length === 0 && (
                  <EmptyState
                    icon={SlidersHorizontal}
                    title="No modifier groups"
                    description="No modifier groups available. Create some in the Modifiers section."
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Image */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              {form.imageUrl ? (
                <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={form.imageUrl} alt={form.imageAltText || form.name} className="object-cover w-full h-full" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setForm({ ...form, imageUrl: "", imageAltText: "" })} aria-label="Remove image">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                  <span className="mt-2 text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload image"}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {form.imageUrl && (
                <div className="space-y-2 mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Alt Text</Label>
                    <Input value={form.imageAltText || ""} onChange={(e) => setForm({ ...form, imageAltText: e.target.value })} placeholder="Image description" className="text-sm" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    Replace Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Variants</span><span className="font-medium">{variants.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Modifier Groups</span><span className="font-medium">{assignedGroupIds.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{categories.find(c => c.id === form.categoryId)?.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{form.status}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete product"
        description="Permanently delete this product? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />

      {/* Unsaved changes navigation confirmation */}
      <ConfirmDialog
        open={confirmNavOpen}
        onOpenChange={setConfirmNavOpen}
        title="Unsaved changes"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmLabel="Leave"
        destructive
        onConfirm={() => {
          setConfirmNavOpen(false);
          const url = pendingNavUrl;
          setPendingNavUrl(null);
          if (url) {
            router.push(url);
          }
        }}
      />
    </div>
  );
}