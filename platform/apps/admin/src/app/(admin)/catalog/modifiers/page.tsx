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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ModifierOption = {
  id: string;
  name: string;
  description?: string;
  priceDeltaAmount: number;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
};

type ModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isRequired: boolean;
  options: ModifierOption[];
};

export default function ModifiersPage() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModifierGroup | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    minSelect: 0,
    maxSelect: 1,
    sortOrder: 0,
    isRequired: false,
  });
  const [newOption, setNewOption] = useState<{ groupId: string; name: string; price: string }>({ groupId: "", name: "", price: "0" });
  const [editOption, setEditOption] = useState<{ groupId: string; optionId: string; name: string; price: string; isDefault: boolean; isActive: boolean } | null>(null);
  const [savingOption, setSavingOption] = useState(false);

  async function loadGroups() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ModifierGroup[]>(
        "/modifiers/groups?locationCode=main",
        undefined,
        session?.accessToken
      );
      setGroups(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load modifiers";
      if (msg.includes("401")) {
        setError("API authentication required — login with real credentials to manage modifiers.");
        setGroups(sampleGroups);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, [session]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", minSelect: 0, maxSelect: 1, sortOrder: 0, isRequired: false });
    setDialogOpen(true);
  }

  function openEdit(group: ModifierGroup) {
    setEditing(group);
    setForm({
      name: group.name,
      description: group.description || "",
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      sortOrder: group.sortOrder,
      isRequired: group.isRequired,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      if (editing) {
        await apiFetch(`/modifiers/groups/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        }, session?.accessToken);
        toast.success("Modifier group updated");
      } else {
        await apiFetch("/modifiers/groups", {
          method: "POST",
          body: JSON.stringify({ ...form, locationCode: "main" }),
        }, session?.accessToken);
        toast.success("Modifier group created");
      }
      setDialogOpen(false);
      loadGroups();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  const sampleGroups: ModifierGroup[] = [
    {
      id: "e2d1f220", name: "Bread Choice", description: "Choose the bread or base for your sandwich build.", minSelect: 1, maxSelect: 1, sortOrder: 0, isRequired: true,
      options: [
        { id: "o1", name: "White Bread", priceDeltaAmount: 0, sortOrder: 0, isDefault: true, isActive: true },
        { id: "o2", name: "Brown Bread", priceDeltaAmount: 0, sortOrder: 1, isDefault: false, isActive: true },
        { id: "o3", name: "White Roll", priceDeltaAmount: 0, sortOrder: 2, isDefault: false, isActive: true },
        { id: "o4", name: "Brown Roll", priceDeltaAmount: 0, sortOrder: 3, isDefault: false, isActive: true },
        { id: "o5", name: "Baguette", priceDeltaAmount: 0, sortOrder: 4, isDefault: false, isActive: true },
        { id: "o6", name: "Wrap", priceDeltaAmount: 0, sortOrder: 5, isDefault: false, isActive: true },
        { id: "o7", name: "Pitta Bread", priceDeltaAmount: 0, sortOrder: 6, isDefault: false, isActive: true },
        { id: "o8", name: "Bagel", priceDeltaAmount: 0, sortOrder: 7, isDefault: false, isActive: true },
        { id: "o9", name: "Bakers Bread Of The Day", priceDeltaAmount: 0, sortOrder: 8, isDefault: false, isActive: true },
      ],
    },
    {
      id: "1d2c9f75", name: "Protein", description: "Choose the main filling for the sandwich.", minSelect: 1, maxSelect: 2, sortOrder: 1, isRequired: true,
      options: [
        { id: "p1", name: "Chicken", priceDeltaAmount: 0, sortOrder: 0, isDefault: true, isActive: true },
        { id: "p2", name: "Roast Beef", priceDeltaAmount: 0, sortOrder: 1, isDefault: false, isActive: true },
        { id: "p3", name: "Corn Beef", priceDeltaAmount: 0, sortOrder: 2, isDefault: false, isActive: true },
        { id: "p4", name: "Tuna", priceDeltaAmount: 0, sortOrder: 3, isDefault: false, isActive: true },
        { id: "p5", name: "Smoked Salmon", priceDeltaAmount: 1.50, sortOrder: 4, isDefault: false, isActive: true },
        { id: "p6", name: "Egg", priceDeltaAmount: 0, sortOrder: 5, isDefault: false, isActive: true },
        { id: "p7", name: "Bacon", priceDeltaAmount: 0, sortOrder: 6, isDefault: false, isActive: true },
        { id: "p8", name: "Sausage", priceDeltaAmount: 0.75, sortOrder: 7, isDefault: false, isActive: true },
        { id: "p9", name: "Honey Roast Ham", priceDeltaAmount: 0, sortOrder: 8, isDefault: false, isActive: true },
        { id: "p10", name: "Ham", priceDeltaAmount: 0, sortOrder: 9, isDefault: false, isActive: true },
        { id: "p11", name: "Palma Ham", priceDeltaAmount: 1.00, sortOrder: 10, isDefault: false, isActive: true },
        { id: "p12", name: "Chorizo", priceDeltaAmount: 0, sortOrder: 11, isDefault: false, isActive: true },
        { id: "p13", name: "Salami", priceDeltaAmount: 0.75, sortOrder: 12, isDefault: false, isActive: true },
        { id: "p14", name: "Pork", priceDeltaAmount: 0, sortOrder: 13, isDefault: false, isActive: true },
        { id: "p15", name: "Pulled Pork", priceDeltaAmount: 1.00, sortOrder: 14, isDefault: false, isActive: true },
        { id: "p16", name: "Prawns", priceDeltaAmount: 1.50, sortOrder: 15, isDefault: false, isActive: true },
      ],
    },
    {
      id: "54ad12a3", name: "Add Cheese", description: "Add one or two cheeses to finish the build.", minSelect: 0, maxSelect: 2, sortOrder: 2, isRequired: false,
      options: [
        { id: "c1", name: "Cheddar", priceDeltaAmount: 0, sortOrder: 0, isDefault: false, isActive: true },
        { id: "c2", name: "Feta", priceDeltaAmount: 0, sortOrder: 1, isDefault: false, isActive: true },
        { id: "c3", name: "Cream Cheese", priceDeltaAmount: 0, sortOrder: 2, isDefault: false, isActive: true },
        { id: "c4", name: "Gouda", priceDeltaAmount: 0, sortOrder: 3, isDefault: false, isActive: true },
        { id: "c5", name: "Mozzarella", priceDeltaAmount: 0, sortOrder: 4, isDefault: false, isActive: true },
      ],
    },
    {
      id: "35965b18", name: "Fresh Veg", description: "Choose fresh veg and salad fillings.", minSelect: 1, maxSelect: 4, sortOrder: 3, isRequired: true,
      options: [
        { id: "vg1", name: "Lettuce", priceDeltaAmount: 0, sortOrder: 0, isDefault: true, isActive: true },
        { id: "vg2", name: "Tomato", priceDeltaAmount: 0, sortOrder: 1, isDefault: false, isActive: true },
        { id: "vg3", name: "Red Onion", priceDeltaAmount: 0, sortOrder: 2, isDefault: false, isActive: true },
        { id: "vg4", name: "Cucumber", priceDeltaAmount: 0, sortOrder: 3, isDefault: false, isActive: true },
        { id: "vg5", name: "Sweetcorn", priceDeltaAmount: 0, sortOrder: 4, isDefault: false, isActive: true },
        { id: "vg6", name: "Spinach", priceDeltaAmount: 0, sortOrder: 5, isDefault: false, isActive: true },
        { id: "vg7", name: "Rocket", priceDeltaAmount: 0, sortOrder: 6, isDefault: false, isActive: true },
        { id: "vg8", name: "Grated Carrot", priceDeltaAmount: 0, sortOrder: 7, isDefault: false, isActive: true },
        { id: "vg9", name: "Peppers", priceDeltaAmount: 0, sortOrder: 8, isDefault: false, isActive: true },
        { id: "vg10", name: "Beetroot", priceDeltaAmount: 0, sortOrder: 9, isDefault: false, isActive: true },
        { id: "vg11", name: "Mushrooms", priceDeltaAmount: 0, sortOrder: 10, isDefault: false, isActive: true },
        { id: "vg12", name: "Avocado", priceDeltaAmount: 1.00, sortOrder: 11, isDefault: false, isActive: true },
        { id: "vg13", name: "Jalapenos", priceDeltaAmount: 0, sortOrder: 12, isDefault: false, isActive: true },
        { id: "vg14", name: "Olives", priceDeltaAmount: 0, sortOrder: 13, isDefault: false, isActive: true },
        { id: "vg15", name: "Garlic", priceDeltaAmount: 0, sortOrder: 14, isDefault: false, isActive: true },
        { id: "vg16", name: "Celery", priceDeltaAmount: 0, sortOrder: 15, isDefault: false, isActive: true },
      ],
    },
    {
      id: "02d5f075", name: "Signature Sauces", description: "Choose one or two sauces to finish the sandwich.", minSelect: 1, maxSelect: 2, sortOrder: 4, isRequired: true,
      options: [
        { id: "s1", name: "Mayonnaise", priceDeltaAmount: 0, sortOrder: 0, isDefault: true, isActive: true },
        { id: "s2", name: "Alioli", priceDeltaAmount: 0, sortOrder: 1, isDefault: false, isActive: true },
        { id: "s3", name: "English Mustard", priceDeltaAmount: 0, sortOrder: 2, isDefault: false, isActive: true },
        { id: "s4", name: "Dijon Mustard", priceDeltaAmount: 0, sortOrder: 3, isDefault: false, isActive: true },
        { id: "s5", name: "Horseradish", priceDeltaAmount: 0, sortOrder: 4, isDefault: false, isActive: true },
        { id: "s6", name: "Mint Sauce", priceDeltaAmount: 0, sortOrder: 5, isDefault: false, isActive: true },
        { id: "s7", name: "Cranberry Sauce", priceDeltaAmount: 0, sortOrder: 6, isDefault: false, isActive: true },
        { id: "s8", name: "Tomato Ketchup", priceDeltaAmount: 0, sortOrder: 7, isDefault: false, isActive: true },
        { id: "s9", name: "Brown Sauce", priceDeltaAmount: 0, sortOrder: 8, isDefault: false, isActive: true },
        { id: "s10", name: "Bbq Sauce", priceDeltaAmount: 0, sortOrder: 9, isDefault: false, isActive: true },
        { id: "s11", name: "Pesto", priceDeltaAmount: 0, sortOrder: 10, isDefault: false, isActive: true },
        { id: "s12", name: "Ranch Sauce", priceDeltaAmount: 0, sortOrder: 11, isDefault: false, isActive: true },
        { id: "s13", name: "Sweet Chilli", priceDeltaAmount: 0, sortOrder: 12, isDefault: false, isActive: true },
        { id: "s14", name: "Hot Sauce", priceDeltaAmount: 0, sortOrder: 13, isDefault: false, isActive: true },
        { id: "s15", name: "Branston Pickle", priceDeltaAmount: 0, sortOrder: 14, isDefault: false, isActive: true },
      ],
    },
    {
      id: "0ecc6333", name: "Premium Extras", description: "Optional premium add-ons for bigger basket value.", minSelect: 0, maxSelect: 4, sortOrder: 5, isRequired: false,
      options: [
        { id: "e1", name: "Extra Protein", priceDeltaAmount: 2.50, sortOrder: 0, isDefault: false, isActive: true },
        { id: "e2", name: "Cheddar Upgrade", priceDeltaAmount: 1.25, sortOrder: 1, isDefault: false, isActive: true },
        { id: "e3", name: "Avocado Upgrade", priceDeltaAmount: 1.25, sortOrder: 2, isDefault: false, isActive: true },
        { id: "e4", name: "Crispy Onions", priceDeltaAmount: 0.75, sortOrder: 3, isDefault: false, isActive: true },
      ],
    },
  ];

  const displayGroups = groups.length > 0 ? groups : (error ? sampleGroups : []);

  async function handleAddOption() {
    if (!session || !newOption.groupId || !newOption.name) return;
    setSavingOption(true);
    try {
      await apiFetch("/modifiers/options", {
        method: "POST",
        body: JSON.stringify({
          locationCode: "main",
          modifierGroupId: newOption.groupId,
          name: newOption.name,
          priceDeltaAmount: parseFloat(newOption.price) || 0,
          isDefault: false,
          isActive: true,
        }),
      }, session.accessToken);
      toast.success("Option added");
      setNewOption({ groupId: "", name: "", price: "0" });
      loadGroups();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Add option failed"); }
    finally { setSavingOption(false); }
  }

  async function handleUpdateOption() {
    if (!session || !editOption) return;
    setSavingOption(true);
    try {
      await apiFetch(`/modifiers/options/${editOption.optionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editOption.name,
          priceDeltaAmount: parseFloat(editOption.price) || 0,
          isDefault: editOption.isDefault,
          isActive: editOption.isActive,
        }),
      }, session.accessToken);
      toast.success("Option updated");
      setEditOption(null);
      loadGroups();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Update failed"); }
    finally { setSavingOption(false); }
  }

  async function handleDeleteOption(optionId: string) {
    if (!session || !confirm("Delete this option?")) return;
    try {
      await apiFetch(`/modifiers/options/${optionId}`, { method: "DELETE" }, session.accessToken);
      toast.success("Option deleted");
      loadGroups();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
  }

  function formatPrice(amount: number) {
    if (amount === 0) return "—";
    return amount > 0 ? `+€${Number(amount).toFixed(2)}` : `-€${(Math.abs(amount)).toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier Groups</h1>
          <p className="text-muted-foreground">Manage customisation options for your menu items.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
  <Plus className="h-4 w-4 mr-2" /> New Group
</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Modifier Group" : "Create Modifier Group"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update group settings." : "Add a new customisation group (e.g. Size, Toppings)."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Size" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Select</Label>
                  <Input type="number" value={form.minSelect} onChange={(e) => setForm({ ...form, minSelect: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Select</Label>
                  <Input type="number" value={form.maxSelect} onChange={(e) => setForm({ ...form, maxSelect: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch checked={form.isRequired} onCheckedChange={(v) => setForm({ ...form, isRequired: v })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!form.name}>
                {editing ? "Update Group" : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-800">
            ⚠️ {error}
          </CardContent>
        </Card>
      )}

      {displayGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4" />
                {group.name}
                {group.isRequired && <Badge variant="secondary" className="text-xs">Required</Badge>}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}>
                  {expandedGroup === group.id ? "Collapse" : "Edit Options"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(group)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {group.description || "No description"} · Select {group.minSelect}–{group.maxSelect} · {group.options.length} options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option</TableHead>
                  <TableHead>Price Delta</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Active</TableHead>
                  {expandedGroup === group.id && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.options.map((opt) => {
                  const isEditing = editOption?.optionId === opt.id;
                  return isEditing ? (
                    <TableRow key={opt.id}>
                      <TableCell><Input value={editOption.name} onChange={(e) => setEditOption({ ...editOption, name: e.target.value })} className="h-8 text-sm" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={editOption.price} onChange={(e) => setEditOption({ ...editOption, price: e.target.value })} className="h-8 text-sm w-20" /></TableCell>
                      <TableCell><Switch checked={editOption.isDefault} onCheckedChange={(v) => setEditOption({ ...editOption, isDefault: v })} /></TableCell>
                      <TableCell><Switch checked={editOption.isActive} onCheckedChange={(v) => setEditOption({ ...editOption, isActive: v })} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" onClick={handleUpdateOption} disabled={savingOption}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditOption(null)}>Cancel</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={opt.id}>
                      <TableCell className="font-medium">{opt.name}</TableCell>
                      <TableCell className="text-sm">{formatPrice(opt.priceDeltaAmount)}</TableCell>
                      <TableCell>{opt.isDefault ? "✓" : ""}</TableCell>
                      <TableCell><Badge variant={opt.isActive ? "default" : "secondary"}>{opt.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      {expandedGroup === group.id && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setEditOption({ groupId: group.id, optionId: opt.id, name: opt.name, price: String(opt.priceDeltaAmount), isDefault: opt.isDefault, isActive: opt.isActive })}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteOption(opt.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {expandedGroup === group.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Add new option</p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input value={newOption.groupId === group.id ? newOption.name : ""} onChange={(e) => setNewOption({ groupId: group.id, name: e.target.value, price: newOption.groupId === group.id ? newOption.price : "0" })} placeholder="e.g. Extra Cheese" className="h-8 text-sm" />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Price (€)</Label>
                    <Input type="number" step="0.01" value={newOption.groupId === group.id ? newOption.price : "0"} onChange={(e) => setNewOption({ ...newOption, groupId: group.id, price: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <Button size="sm" onClick={handleAddOption} disabled={savingOption || !newOption.name || newOption.groupId !== group.id}>Add</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}