"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Armchair,
  Plus,
  Pencil,
  QrCode,
  Check,
  X,
  Users,
  Loader2,
  Copy,
  Download,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { toast } from "sonner";

type DiningTable = {
  id: string;
  tableNumber: number;
  name: string | null;
  qrSlug: string;
  seats: number | null;
  isActive: boolean;
};

export default function TablesPage() {
  const { session, updateSession } = useAuth();
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTable | null>(null);
  const [form, setForm] = useState({ name: "", seats: 2, isActive: true, tableNumber: 0 });
  const [saving, setSaving] = useState(false);
  const [qrExpanded, setQrExpanded] = useState<string | null>(null);

  // Inline editing state
  const [editingField, setEditingField] = useState<{ id: string; field: "name" | "seats" } | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchTables = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const data = await apiFetch<DiningTable[]>("/tables?locationCode=main", {}, session.accessToken);
      setTables(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  function openCreate() {
    setEditing(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map((t) => t.tableNumber)) + 1 : 1;
    setForm({ name: "", seats: 2, isActive: true, tableNumber: nextNum });
    setDialogOpen(true);
  }

  function openEdit(table: DiningTable) {
    setEditing(table);
    setForm({
      name: table.name || "",
      seats: table.seats || 2,
      isActive: table.isActive,
      tableNumber: table.tableNumber,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      if (editing) {
        await withAdminSession(session, (token) =>
          apiFetch(`/tables/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: form.name || null,
              seats: form.seats,
              isActive: form.isActive,
            }),
          }, token), updateSession);
        toast.success("Table updated");
      } else {
        await withAdminSession(session, (token) =>
          apiFetch("/tables?locationCode=main", {
            method: "POST",
            body: JSON.stringify({
              tableNumber: form.tableNumber,
              name: form.name || null,
              qrSlug: `table-${form.tableNumber}-main`,
              seats: form.seats,
              isActive: form.isActive,
            }),
          }, token), updateSession);
        toast.success("Table created");
      }
      setDialogOpen(false);
      fetchTables();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(table: DiningTable) {
    if (!session) return;
    try {
      await withAdminSession(
        session,
        (token) =>
          apiFetch(`/tables/${table.id}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: !table.isActive }),
          }, token),
        updateSession
      );
      toast.success(`Table #${table.tableNumber} ${table.isActive ? "deactivated" : "activated"}`);
      fetchTables();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    }
  }

  async function handleInlineSave(id: string, field: "name" | "seats") {
    if (!session) return;
    const value = field === "seats" ? parseInt(editValue) || 2 : editValue || null;
    try {
      await withAdminSession(
        session,
        (token) =>
          apiFetch(`/tables/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ [field]: value }),
          }, token),
        updateSession
      );
      toast.success("Updated");
      setEditingField(null);
      fetchTables();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  function startInlineEdit(id: string, field: "name" | "seats", currentValue: string) {
    setEditingField({ id, field });
    setEditValue(currentValue);
  }

  function handleCopyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }

  function handleDownloadQr(table: DiningTable, baseUrl: string) {
    const qrUrl = `${baseUrl}/?table=${table.qrSlug}`;
    const svg = document.getElementById(`qr-svg-${table.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 480;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 50, 20, 300, 300);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Table ${table.tableNumber}${table.name ? ` — ${table.name}` : ""}`, 200, 350);
      ctx.font = "12px monospace";
      ctx.fillStyle = "#555555";
      ctx.fillText(qrUrl, 200, 380);

      const link = document.createElement("a");
      link.download = `table-${table.tableNumber}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  // QR codes must point at the public storefront, NOT the admin app.
  // Resolution order: NEXT_PUBLIC_STOREFRONT_URL → strip "admin." from current origin → current origin (dev fallback).
  const storefrontUrlFromEnv = process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "");
  const derivedFromAdminOrigin =
    typeof window !== "undefined" && window.location.hostname.startsWith("admin.")
      ? `${window.location.protocol}//${window.location.hostname.replace(/^admin\./, "")}`
      : null;
  const baseUrl =
    storefrontUrlFromEnv ??
    derivedFromAdminOrigin ??
    (typeof window !== "undefined" ? window.location.origin : "");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading tables...
      </div>
    );
  }

  if (error && tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-destructive" role="alert">
        <AlertTriangle className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Failed to load tables</p>
        <p className="text-sm mt-1">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchTables}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
            <p className="text-muted-foreground">
              {tables.filter((t) => t.isActive).length} active &middot;{" "}
              {tables.filter((t) => !t.isActive).length} inactive
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Table
          </Button>
        </div>

        {/* Empty state */}
        {tables.length === 0 && !loading && !error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No tables yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Get started by adding your first dining table.</p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </div>
        ) : (
          /* Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => {
              const isEditingName = editingField?.id === table.id && editingField?.field === "name";
              const isEditingSeats = editingField?.id === table.id && editingField?.field === "seats";
              const qrUrl = `${baseUrl}/?table=${table.qrSlug}`;
              const isQrExpanded = qrExpanded === table.id;

              return (
                <Card
                  key={table.id}
                  className={`bg-[#111] border-border/40 transition-opacity ${
                    table.isActive ? "" : "opacity-60"
                  }`}
                >
                  <CardContent className="pt-4 space-y-3">
                    {/* Table number + active toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
                          {table.tableNumber}
                        </div>
                        <div>
                          {isEditingName ? (
                            <div className="flex items-center gap-1">
                              <Input
                                className="h-7 text-sm w-28 bg-[#050505]"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleInlineSave(table.id, "name");
                                  if (e.key === "Escape") setEditingField(null);
                                }}
                                aria-label="Edit table name"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6"
                                onClick={() => handleInlineSave(table.id, "name")}
                                aria-label="Save name"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6"
                                onClick={() => setEditingField(null)}
                                aria-label="Cancel editing"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="text-sm font-medium cursor-pointer hover:underline"
                              onClick={() =>
                                startInlineEdit(table.id, "name", table.name || "")
                              }
                            >
                              {table.name || "Unnamed"}
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {isEditingSeats ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  className="h-6 text-xs w-14 bg-[#050505]"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleInlineSave(table.id, "seats");
                                    if (e.key === "Escape") setEditingField(null);
                                  }}
                                  aria-label="Edit seat count"
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-5 w-5"
                                  onClick={() => handleInlineSave(table.id, "seats")}
                                  aria-label="Save seats"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-5 w-5"
                                  onClick={() => setEditingField(null)}
                                  aria-label="Cancel editing"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:underline"
                                onClick={() =>
                                  startInlineEdit(table.id, "seats", String(table.seats || 2))
                                }
                              >
                                <Users className="h-3 w-3 inline mr-0.5" />
                                {table.seats || "\u2014"} seats
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={table.isActive}
                        onCheckedChange={() => handleToggleActive(table)}
                        aria-label={`${table.isActive ? "Deactivate" : "Activate"} table ${table.tableNumber}`}
                      />
                    </div>

                    {/* QR code section */}
                    {isQrExpanded && (
                      <div className="flex flex-col items-center gap-2 py-2 border-t border-b border-border/30">
                        <QRCodeSVG
                          id={`qr-svg-${table.id}`}
                          value={qrUrl}
                          size={160}
                          level="M"
                          bgColor="#ffffff"
                          fgColor="#000000"
                          includeMargin
                        />
                        <p className="text-xs text-muted-foreground font-mono text-center break-all max-w-[200px]">
                          {qrUrl}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleCopyUrl(qrUrl)} aria-label="Copy QR URL">
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy URL
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadQr(table, baseUrl)} aria-label="Download QR code">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download QR
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/30">
                      <Tooltip>
                        <TooltipTrigger
                          render={<button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label={`Show QR code for table ${table.tableNumber}`} onClick={() => setQrExpanded(isQrExpanded ? null : table.id)} />}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span className="font-mono text-[11px] truncate max-w-[120px]">{qrUrl}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="font-mono text-xs break-all max-w-xs">
                          {qrUrl}
                        </TooltipContent>
                      </Tooltip>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(table)} aria-label={`Edit table ${table.tableNumber}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#111] border-border/50" aria-modal="true">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Table" : "Create Table"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update table details." : "Add a new dining table."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="table-number">Table Number</Label>
                <Input
                  id="table-number"
                  type="number"
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: parseInt(e.target.value) || 1 })}
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-name">Name</Label>
                <Input
                  id="table-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Window Seat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-seats">Seats</Label>
                <Input
                  id="table-seats"
                  type="number"
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) || 2 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="table-active">Active</Label>
                <Switch
                  id="table-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Table" : "Create Table"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}