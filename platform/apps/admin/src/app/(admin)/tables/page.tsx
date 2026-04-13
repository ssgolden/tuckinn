"use client";

import { useState } from "react";
import { Armchair, Plus, Pencil, QrCode } from "lucide-react";
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

type DiningTable = {
  id: string;
  tableNumber: number;
  name: string | null;
  qrSlug: string;
  seats: number | null;
  isActive: boolean;
};

const sampleTables: DiningTable[] = [
  { id: "1", tableNumber: 1, name: "Window Seat", qrSlug: "table-1-main", seats: 2, isActive: true },
  { id: "2", tableNumber: 2, name: "Booth", qrSlug: "table-2-main", seats: 4, isActive: true },
  { id: "3", tableNumber: 3, name: "Patio", qrSlug: "table-3-main", seats: 4, isActive: true },
  { id: "4", tableNumber: 4, name: "Bar Stool", qrSlug: "table-4-main", seats: 1, isActive: true },
  { id: "5", tableNumber: 5, name: "Corner Nook", qrSlug: "table-5-main", seats: 2, isActive: true },
  { id: "6", tableNumber: 6, name: "Garden", qrSlug: "table-6-main", seats: 6, isActive: true },
  { id: "7", tableNumber: 7, name: "Fireplace", qrSlug: "table-7-main", seats: 4, isActive: true },
  { id: "8", tableNumber: 8, name: "Cozy Spot", qrSlug: "table-8-main", seats: 2, isActive: true },
  { id: "9", tableNumber: 9, name: "Family", qrSlug: "table-9-main", seats: 8, isActive: true },
  { id: "10", tableNumber: 10, name: "VIP", qrSlug: "table-10-main", seats: 6, isActive: true },
  { id: "11", tableNumber: 11, name: null, qrSlug: "table-11-main", seats: 2, isActive: false },
  { id: "12", tableNumber: 12, name: null, qrSlug: "table-12-main", seats: 2, isActive: false },
  { id: "13", tableNumber: 13, name: null, qrSlug: "table-13-main", seats: 4, isActive: false },
  { id: "14", tableNumber: 14, name: null, qrSlug: "table-14-main", seats: 4, isActive: false },
  { id: "15", tableNumber: 15, name: null, qrSlug: "table-15-main", seats: 4, isActive: false },
];

export default function TablesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DiningTable | null>(null);
  const [form, setForm] = useState({ name: "", seats: 2, isActive: true });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", seats: 2, isActive: true });
    setDialogOpen(true);
  }

  function openEdit(table: DiningTable) {
    setEditing(table);
    setForm({ name: table.name || "", seats: table.seats || 2, isActive: table.isActive });
    setDialogOpen(true);
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

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
              <Button className="w-full" disabled={!editing && !form.name}>
                {editing ? "Update Table" : "Create Table"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4 text-sm text-amber-800">
          ⚠️ Table management API is coming soon. Showing current tables from database — edits will be wired when the API is ready.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Armchair className="h-5 w-5" />
            All Tables ({sampleTables.length})
          </CardTitle>
          <CardDescription>{sampleTables.filter((t) => t.isActive).length} active · {sampleTables.filter((t) => !t.isActive).length} inactive</CardDescription>
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
              {sampleTables.map((table) => (
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(table)}>
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