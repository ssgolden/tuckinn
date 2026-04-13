"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";

type ContentBlock = {
  id: string;
  key: string;
  title: string;
  status: "draft" | "published" | "archived";
  payload: Record<string, unknown>;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export default function ContentPage() {
  const { session } = useAuth();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentBlock | null>(null);
  const [form, setForm] = useState({ key: "", title: "", status: "draft" as ContentBlock["status"], message: "" });
  const [saving, setSaving] = useState(false);

  const fetchBlocks = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const data = await apiFetch<ContentBlock[]>("/content/blocks?locationCode=main", {}, session.accessToken);
      setBlocks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load content blocks");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  function openCreate() {
    setEditing(null);
    setForm({ key: "", title: "", status: "draft", message: "" });
    setDialogOpen(true);
  }

  function openEdit(block: ContentBlock) {
    setEditing(block);
    const p = block.payload as Record<string, string>;
    setForm({ key: block.key, title: block.title, status: block.status, message: p.message || p.body || p.cta || "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      const payload = editing
        ? { ...editing.payload, message: form.message }
        : { type: "banner", message: form.message };

      if (editing) {
        await withAdminSession(session, (token) =>
          apiFetch(`/content/blocks/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify({ key: form.key, title: form.title, status: form.status, payload }),
          }, token), () => {}
        );
      } else {
        await withAdminSession(session, (token) =>
          apiFetch("/content/blocks?locationCode=main", {
            method: "POST",
            body: JSON.stringify({ key: form.key, title: form.title, status: form.status, payload }),
          }, token), () => {}
        );
      }
      setDialogOpen(false);
      fetchBlocks();
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(block: ContentBlock) {
    if (!session || !confirm(`Delete "${block.title}"?`)) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/content/blocks/${block.id}`, { method: "DELETE" }, token), () => {}
      );
      fetchBlocks();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  }

  async function toggleStatus(block: ContentBlock) {
    if (!session) return;
    const next = block.status === "published" ? "draft" : "published";
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/content/blocks/${block.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        }, token), () => {}
      );
      fetchBlocks();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading content blocks…</div>;
  if (error && blocks.length === 0) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Blocks</h1>
          <p className="text-muted-foreground">Manage CMS content — announcement bars, hero sections, promos.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="h-4 w-4 mr-2" /> New Block
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Block" : "Create Block"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update this content block." : "Add a new CMS content block."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. announcement-bar" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContentBlock["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Announcement Bar" />
              </div>
              <div className="space-y-2">
                <Label>Message / Content</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Content text" rows={3} />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving || !form.key || !form.title}>
                {saving ? "Saving…" : editing ? "Update Block" : "Create Block"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Blocks ({blocks.length})
          </CardTitle>
          <CardDescription>CMS content blocks for storefront rendering.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No content blocks yet.</TableCell></TableRow>
              ) : blocks.map((block) => (
                <TableRow key={block.id}>
                  <TableCell className="font-mono text-xs">{block.key}</TableCell>
                  <TableCell className="font-medium">{block.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={block.status === "published" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(block)}
                    >
                      {block.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {block.startsAt ? `${new Date(block.startsAt).toLocaleDateString()} → ${block.endsAt ? new Date(block.endsAt).toLocaleDateString() : "∞"}` : "Always"}
                  </TableCell>
                  <TableCell className="text-sm">{new Date(block.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(block)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(block)}>
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