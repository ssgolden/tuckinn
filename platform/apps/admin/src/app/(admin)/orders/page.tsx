"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type OrderItem = { name: string; quantity: number; unitPrice: number };

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  orderKind: string;
  totalAmount: number;
  currencyCode: string;
  customerName?: string;
  items: OrderItem[];
  createdAt: string;
  table?: { name?: string; tableNumber: number };
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  accepted: "bg-indigo-100 text-indigo-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-stone-100 text-stone-600",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

const NEXT_STATUS: Record<string, string> = {
  pending_payment: "paid",
  paid: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

export default function OrdersPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"active" | "history" | "all">("active");

  const loadOrders = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Order[]>(
        `/orders?locationCode=main&scope=${scope}`,
        undefined,
        session.accessToken
      );
      setOrders(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load orders";
      setError(msg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [session, scope]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function advanceOrder(orderId: string, currentStatus: string) {
    if (!session) return;
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/fulfillment/orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        }, token), () => {}
      );
      toast.success(`Order moved to ${next.replace(/_/g, " ")}`);
      loadOrders();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Status update failed");
    }
  }

  function formatPrice(amount: number) {
    return `€${Number(amount).toFixed(2)}`;
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and manage all orders, update fulfillment status.</p>
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v as "active" | "history" | "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="history">History</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-sm text-red-800">
            Failed to load orders: {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {scope === "active" ? "Active" : scope === "history" ? "Completed" : "All"} Orders ({orders.length})
          </CardTitle>
          <CardDescription>Click advance to move orders through the fulfillment pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Advance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No {scope} orders found.</TableCell></TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                    <TableCell className="text-sm">{formatTime(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{order.orderKind}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{order.table?.name || order.table?.tableNumber || "—"}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{order.items?.map((i) => `${i.quantity}× ${i.name}`).join(", ") || "—"}</TableCell>
                    <TableCell className="font-medium">{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || "bg-stone-100 text-stone-600"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {NEXT_STATUS[order.status] ? (
                        <Button variant="outline" size="sm" onClick={() => advanceOrder(order.id, order.status)}>
                          <ArrowRight className="h-3.5 w-3.5 mr-1" />
                          {NEXT_STATUS[order.status].replace(/_/g, " ")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Done</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}