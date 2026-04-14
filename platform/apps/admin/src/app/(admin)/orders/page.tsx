"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Search,
  Clock,
  Package,
  ArrowRight,
  ArrowLeft,
  Inbox,
  RefreshCw,
  User,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";

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

type StatusTab = "all" | "pending_payment" | "paid" | "preparing" | "ready" | "completed" | "cancelled";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  accepted: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  preparing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ready: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-stone-500/20 text-stone-400 border-stone-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  refunded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  pending_payment: { status: "paid", label: "Accept Payment" },
  paid: { status: "accepted", label: "Accept Order" },
  accepted: { status: "preparing", label: "Start Preparing" },
  preparing: { status: "ready", label: "Mark Ready" },
  ready: { status: "completed", label: "Complete" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatPrice(amount: number) {
  return `€${Number(amount).toFixed(2)}`;
}

export default function OrdersPage() {
  const { session, updateSession } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<"all" | "today" | "7d" | "30d">("all");
  const [page, setPage] = useState(1);
  const ordersPerPage = 25;

  const [advancing, setAdvancing] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrders = useCallback(async () => {
    if (!session) return;
    try {
      const data = await apiFetch<Order[]>(
        `/orders?limit=50`,
        undefined,
        session.accessToken
      );
      setOrders(data);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load orders";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    loadOrders();
    pollRef.current = setInterval(loadOrders, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadOrders]);

  async function advanceOrder(orderId: string, currentStatus: string) {
    if (!session) return;
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    setAdvancing(orderId);
    try {
      await withAdminSession(session, (token) =>
        apiFetch(`/fulfillment/orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: next.status }),
        }, token), updateSession
      );
      toast.success(`Order moved to ${next.status.replace(/_/g, " ")}`);
      await loadOrders();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Status update failed");
    } finally {
      setAdvancing(null);
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== "all" && o.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchCustomer = (o.customerName || "").toLowerCase().includes(q);
      if (!matchNumber && !matchCustomer) return false;
    }
    if (dateRange !== "all") {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      if (dateRange === "today") {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === "7d") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < sevenDaysAgo) return false;
      } else if (dateRange === "30d") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < thirtyDaysAgo) return false;
      }
    }
    return true;
  });

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [activeTab, search, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = filteredOrders.slice((page - 1) * ordersPerPage, page * ordersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and manage orders, update fulfillment status.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 inline mr-1.5 align-text-bottom" />
            Failed to load orders: {error}
          </CardContent>
        </Card>
      )}

      {/* Tabs + Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#111] border-border/50"
            />
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as "all" | "today" | "7d" | "30d")}>
            <SelectTrigger className="min-w-[130px] bg-[#111] border-border/50">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusTab)}>
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {tab.value === "all"
                    ? orders.length
                    : orders.filter((o) => o.status === tab.value).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All tabs share the same content rendering */}
          {STATUS_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {loading && filteredOrders.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground" role="status" aria-live="polite">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Loading orders...
                </div>
              ) : filteredOrders.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No orders found"
                  description={search
                    ? "Try adjusting your search query."
                    : `No ${tab.value === "all" ? "" : tab.label.toLowerCase() + " "}orders to display.`}
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedOrders.map((order) => {
                    const next = NEXT_STATUS[order.status];
                    return (
                      <Card
                        key={order.id}
                        className="cursor-pointer bg-[#111] border-border/40 hover:border-border transition-colors"
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <CardContent className="pt-4 space-y-3">
                          {/* Order header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-sm">
                                  #{order.orderNumber}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                    STATUS_COLORS[order.status] || "bg-stone-500/20 text-stone-400 border-stone-500/30"
                                  }`}
                                >
                                  {order.status.replace(/_/g, " ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {timeAgo(order.createdAt)}
                              </div>
                            </div>
                            <span className="text-lg font-bold">
                              {formatPrice(order.totalAmount)}
                            </span>
                          </div>

                          {/* Customer & items */}
                          <div className="flex items-center gap-4 text-sm">
                            {order.customerName && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                {order.customerName}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Package className="h-3 w-3" />
                              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                            </div>
                            {order.table && (
                              <span className="text-xs text-muted-foreground">
                                Table {order.table.name || order.table.tableNumber}
                              </span>
                            )}
                          </div>

                          {/* Action */}
                          {next && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-8"
                              disabled={advancing === order.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                advanceOrder(order.id, order.status);
                              }}
                            >
                              {advancing === order.id ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <ArrowRight className="h-3 w-3 mr-1" />
                              )}
                              {next.label}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}