"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
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
import { Plus, Pencil, SlidersHorizontal, Trash2, LayoutGrid, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const { session, updateSession } = useAuth();
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
  const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

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
    if (!session) return;
    try {
      if (editing) {
        await withAdminSession(session, (token) =>
          apiFetch(`/modifiers/groups/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(form),
          }, token), updateSession
        );
        toast.success("Modifier group updated");
      } else {
        await withAdminSession(session, (token) =>
          apiFetch("/modifiers/groups", {
            method: "POST",
            body: JSON.stringify({ ...form, locationCode: "main" }),
          }, token), updateSession
        );
        toast.success("Modifier group created");
      }
      setDialogOpen(false);
      loadGroups();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function handleAddOption() {
    if (!session || !newOption.groupId || !newOption.name) return;
    setSavingOption(true);
    try {
      await withAdminSession(session, (token) =>
        apiFetch("/modifiers/options", {
          method: "POST",
          body: JSON.stringify({
            locationCode: "main",
            modifierGroupId: newOption.groupId,
            name: newOption.name,
            priceDeltaAmount: parseFloat(newOption.price) || 0,
            isDefault: false,
            isActive: true,
          }),
        }, token), updateSession
      );
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
      await withAdminSession(session, (token) =>
        apiFetch(`/modifiers/options/${editOption.optionId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: editOption.name,
            priceDeltaAmount: parseFloat(editOption.price) || 0,
            isDefault: editOption.isDefault,
            isActive: editOption.isActive,
          }),
        }, token), updateSession
      );
      toast.success("Option updated");
      setEditOption(null);
      loadGroups();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Update failed"); }
    finally { setSavingOption(false); }
  }

  async function handleDeleteOption(optionId: string) {
    if (!session) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/modifiers/options/${optionId}`, { method: "DELETE" }, token), updateSession
      );
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
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New Group</Button>
          <DialogContent aria-modal="true">
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
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="pt-4 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 inline mr-1.5 align-text-bottom" />{error}
            <Button variant="outline" size="sm" className="ml-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={loadGroups}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">No modifier groups yet</p>
            <p className="text-sm mb-4">Create your first modifier group to customise menu items.</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New Group</Button>
          </CardContent>
        </Card>
      ) : groups.map((group: ModifierGroup) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4" />
                {group.name}
                {group.isRequired && <Badge variant="secondary" className="text-xs">Required</Badge>}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)} aria-expanded={expandedGroup === group.id}>
                  {expandedGroup === group.id ? "Collapse" : "Edit Options"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(group)} aria-label={`Edit ${group.name}`}>
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
                {group.options.map((opt: ModifierOption) => {
                  const isEditing = editOption?.optionId === opt.id;
                  return isEditing && editOption ? (
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
                      <TableCell>{opt.isDefault ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : ""}</TableCell>
                      <TableCell><Badge variant={opt.isActive ? "default" : "secondary"}>{opt.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      {expandedGroup === group.id && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setEditOption({ groupId: group.id, optionId: opt.id, name: opt.name, price: String(opt.priceDeltaAmount), isDefault: opt.isDefault, isActive: opt.isActive })} aria-label={`Edit ${opt.name}`}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => setDeleteOptionId(opt.id)} aria-label={`Delete ${opt.name}`}>
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

      <ConfirmDialog
        open={!!deleteOptionId}
        onOpenChange={(open) => { if (!open) setDeleteOptionId(null); }}
        title="Delete option"
        description="Are you sure you want to delete this option? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteOptionId) handleDeleteOption(deleteOptionId); }}
      />
    </div>
  );
}