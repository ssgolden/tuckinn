"use client";

import { useState, useEffect, useCallback } from "react";
import { Armchair, Plus, Pencil, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession, type AdminSession } from "@/lib/api";

type DiningTable = {
  id: string;
  tableNumber: number;
  name: string | null;
  qrSlug: string;
  seats: number | null;
  isActive: boolean;
};

export default function TablesPage() {
  const { session } = useAuth();
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTable | null>(null);
  const [form, setForm] = useState({ name: "", seats: 2, isActive: true, tableNumber: 0 });
  const [saving, setSaving] = useState(false);

  const fetchTables = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const data = await apiFetch<DiningTable[]>("/tables?locationCode=main", {}, session.accessToken);
      setTables(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  function openCreate() {
    setEditing(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map(t => t.tableNumber)) + 1 : 1;
    setForm({ name: "", seats: 2, isActive: true, tableNumber: nextNum });
    setDialogOpen(true);
  }

  function openEdit(table: DiningTable) {
    setEditing(table);
    setForm({ name: table.name || "", seats: table.seats || 2, isActive: table.isActive, tableNumber: table.tableNumber });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      if (editing) {
        await withAdminSession(
          session,
          (token) => apiFetch(`/tables/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: form.name || null, seats: form.seats, isActive: form.isActive }),
          }, token),
          (s) => {}
        );
      } else {
        await withAdminSession(
          session,
          (token) => apiFetch("/tables?locationCode=main", {
            method: "POST",
            body: JSON.stringify({
              tableNumber: form.tableNumber,
              name: form.name || null,
              qrSlug: `table-${form.tableNumber}-main`,
              seats: form.seats,
              isActive: form.isActive,
            }),
          }, token),
          (s) => {}
        );
      }
      setDialogOpen(false);
      fetchTables();
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(table: DiningTable) {
    if (!session || !confirm(`Delete Table #${table.tableNumber}?`)) return;
    try {
      await withAdminSession(session, (token) => apiFetch(`/tables/${table.id}`, { method: "DELETE" }, token), () => {});
      fetchTables();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading tables…</div>;

  if (error && tables.length === 0) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">Manage dining tables, names, and QR codes.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="h-4 w-4 mr-2" /> Add Table
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Table" : "Add Table"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update table details." : "Add a new dining table."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Table Number</Label>
                <Input type="number" value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: parseInt(e.target.value) || 1 })} disabled={!!editing} />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Window Seat" />
              </div>
              <div className="space-y-2">
                <Label>Seats</Label>
                <Input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 2 })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editing ? "Update Table" : "Create Table"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Armchair className="h-5 w-5" />
            All Tables ({tables.length})
          </CardTitle>
          <CardDescription>{tables.filter((t) => t.isActive).length} active · {tables.filter((t) => !t.isActive).length} inactive</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-mono font-medium">{table.tableNumber}</TableCell>
                  <TableCell>{table.name || <span className="text-muted-foreground italic">Unnamed</span>}</TableCell>
                  <TableCell>{table.seats || "—"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                      <QrCode className="h-3 w-3" />
                      {baseUrl}/?table={table.qrSlug}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={table.isActive ? "default" : "secondary"}>
                      {table.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(table)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(table)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}