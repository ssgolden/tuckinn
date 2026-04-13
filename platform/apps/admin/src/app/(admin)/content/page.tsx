"use client";

import { useState } from "react";
import { FileText, Plus, Pencil } from "lucide-react";
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

const sampleBlocks: ContentBlock[] = [
  { id: "1", key: "announcement-bar", title: "Announcement Bar", status: "published", payload: { message: "Free delivery on orders over €25!", color: "red" }, startsAt: null, endsAt: null, createdAt: "2026-04-10" },
  { id: "2", key: "hero-highlight", title: "Hero Highlight", status: "published", payload: { headline: "New Spring Menu", subtext: "Fresh seasonal dishes available now", ctaText: "View Menu", ctaUrl: "/menu" }, startsAt: null, endsAt: null, createdAt: "2026-04-09" },
  { id: "3", key: "promo-banner", title: "Promo Banner", status: "draft", payload: { message: "Happy Hour 5–7pm — 20% off all drinks!", background: "#1a1a1a" }, startsAt: "2026-04-15T17:00:00Z", endsAt: "2026-04-15T19:00:00Z", createdAt: "2026-04-12" },
];

export default function ContentPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentBlock | null>(null);
  const [form, setForm] = useState({ key: "", title: "", status: "draft" as ContentBlock["status"], message: "" });

  function openCreate() {
    setEditing(null);
    setForm({ key: "", title: "", status: "draft", message: "" });
    setDialogOpen(true);
  }

  function openEdit(block: ContentBlock) {
    setEditing(block);
    setForm({ key: block.key, title: block.title, status: block.status, message: (block.payload as { message?: string }).message || "" });
    setDialogOpen(true);
  }

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
              <Button className="w-full" disabled={!form.key || !form.title}>
                {editing ? "Update Block" : "Create Block"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4 text-sm text-amber-800">
          ⚠️ Content management API is coming soon. Showing current blocks — edits will be wired when the API is ready.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Blocks ({sampleBlocks.length})
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
              {sampleBlocks.map((block) => (
                <TableRow key={block.id}>
                  <TableCell className="font-mono text-xs">{block.key}</TableCell>
                  <TableCell className="font-medium">{block.title}</TableCell>
                  <TableCell>
                    <Badge variant={block.status === "published" ? "default" : "secondary"}>
                      {block.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {block.startsAt ? `${new Date(block.startsAt).toLocaleDateString()} → ${block.endsAt ? new Date(block.endsAt).toLocaleDateString() : "∞"}` : "Always"}
                  </TableCell>
                  <TableCell className="text-sm">{new Date(block.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(block)}>
                      <Pencil className="h-3.5 w-3.5" />
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