"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
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

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Order[]>(
        `/orders?locationCode=main&scope=${scope}`,
        undefined,
        session?.accessToken
      );
      setOrders(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load orders";
      if (msg.includes("401")) {
        setError("API authentication required — login with real credentials to manage orders.");
        setOrders(sampleOrders);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [session, scope]);

  async function advanceOrder(orderId: string, currentStatus: string) {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await apiFetch(`/fulfillment/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      }, session?.accessToken);
      toast.success(`Order moved to ${next.replace(/_/g, " ")}`);
      loadOrders();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Status update failed");
    }
  }

  const sampleOrders: Order[] = [
    { id: "1", orderNumber: "TKN-001", status: "preparing", orderKind: "instore", totalAmount: 9.95, currencyCode: "EUR", customerName: "Walk-in", items: [{ name: "Tuckinn Proper Original", quantity: 1, unitPrice: 9.95 }], createdAt: "2026-04-13T12:00:00Z", table: { tableNumber: 3, name: "Window Seat" } },
    { id: "2", orderNumber: "TKN-002", status: "ready", orderKind: "instore", totalAmount: 19.95, currencyCode: "EUR", customerName: "Walk-in", items: [{ name: "Option 3", quantity: 1, unitPrice: 19.95 }], createdAt: "2026-04-13T11:45:00Z", table: { tableNumber: 7, name: "Booth" } },
    { id: "3", orderNumber: "TKN-003", status: "paid", orderKind: "collect", totalAmount: 13.95, currencyCode: "EUR", customerName: "Sarah M.", items: [{ name: "Option 2", quantity: 1, unitPrice: 13.95 }], createdAt: "2026-04-13T11:30:00Z" },
    { id: "4", orderNumber: "TKN-004", status: "completed", orderKind: "instore", totalAmount: 14.40, currencyCode: "EUR", customerName: "Walk-in", items: [{ name: "Build Your Own Sandwich", quantity: 1, unitPrice: 6.45 }, { name: "Tropical Escape", quantity: 1, unitPrice: 4.95 }, { name: "Cappuccino", quantity: 1, unitPrice: 3.00 }], createdAt: "2026-04-13T10:00:00Z", table: { tableNumber: 1, name: "Patio" } },
    { id: "5", orderNumber: "TKN-005", status: "pending_payment", orderKind: "instore", totalAmount: 8.95, currencyCode: "EUR", customerName: "Walk-in", items: [{ name: "Deluxe House Stack", quantity: 1, unitPrice: 8.95 }], createdAt: "2026-04-13T12:10:00Z", table: { tableNumber: 5, name: "Bar Stool" } },
  ];

  const displayOrders = orders.length > 0 ? orders : (error ? sampleOrders : []);

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
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-800">
            ⚠️ {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {scope === "active" ? "Active" : scope === "history" ? "Completed" : "All"} Orders ({displayOrders.length})
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
              ) : displayOrders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No orders found.</TableCell></TableRow>
              ) : (
                displayOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                    <TableCell className="text-sm">{formatTime(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{order.orderKind}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{order.table?.name || order.table?.tableNumber || "—"}</TableCell>
                    <TableCell className="text-sm">{order.items?.map((i) => `${i.quantity}× ${i.name}`).join(", ") || "—"}</TableCell>
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