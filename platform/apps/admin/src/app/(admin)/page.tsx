"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  FolderOpen,
  Armchair,
  SlidersHorizontal,
  DollarSign,
  Activity,
  Clock,
  ShoppingCart,
  Plus,
  List,
  UtensilsCrossed,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

// ─── Types ──────────────────────────────────────────

type DashboardAnalytics = {
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalModifierGroups: number;
  totalTables: number;
  totalRevenue: number;
  recentOrders: RecentOrder[];
  ordersByStatus: Record<string, number>;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  customerName?: string;
  totalAmount: number;
  currencyCode: string;
  createdAt: string;
};

// ─── Status config ───────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending_payment: {
    label: "Pending",
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
  },
  paid: {
    label: "Paid",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
  },
  accepted: {
    label: "Accepted",
    bg: "bg-indigo-500/15",
    text: "text-indigo-400",
  },
  preparing: {
    label: "Preparing",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
  },
  ready: {
    label: "Ready",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-stone-500/15",
    text: "text-stone-400",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-500/15",
    text: "text-red-400",
  },
  refunded: {
    label: "Refunded",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
  },
};

const STATUS_ORDER = [
  "pending_payment",
  "paid",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

// ─── Helpers ────────────────────────────────────────

function formatEur(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) {
    return (
      <Badge variant="outline" className="text-xs">
        {status}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`${cfg.bg} ${cfg.text} border-transparent text-xs`}
    >
      {cfg.label}
    </Badge>
  );
}

// ─── Skeletons ───────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="bg-[#111] border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-24" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────

export default function DashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<DashboardAnalytics>(
        "/analytics/dashboard",
        undefined,
        session.accessToken
      );
      setData(result);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : "Failed to load dashboard";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ─── Stats ────────────────────────────────────────

  const stats = [
    {
      label: "Total Revenue",
      value: data ? formatEur(data.totalRevenue) : "—",
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: data ? String(data.totalOrders) : "—",
      icon: ShoppingCart,
    },
    {
      label: "Products",
      value: data ? String(data.totalProducts) : "—",
      icon: Package,
    },
    {
      label: "Categories",
      value: data ? String(data.totalCategories) : "—",
      icon: FolderOpen,
    },
    {
      label: "Modifier Groups",
      value: data ? String(data.totalModifierGroups) : "—",
      icon: SlidersHorizontal,
    },
    {
      label: "Tables",
      value: data ? String(data.totalTables) : "—",
      icon: Armchair,
    },
  ];

  // ─── Render ───────────────────────────────────────

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20" role="alert">
        <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={loadDashboard}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Overview of your Tuckinn Proper operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders">
            <Button variant="outline" size="sm" className="gap-1.5">
              <List className="h-4 w-4" />
              View All Orders
            </Button>
          </Link>
          <Link href="/catalog/products">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link href="/catalog/categories">
            <Button variant="outline" size="sm" className="gap-1.5">
              <UtensilsCrossed className="h-4 w-4" />
              View Menu
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => (
              <Card key={stat.label} className="bg-[#111] border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Order Status Breakdown + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <Card className="bg-[#111] border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Order Status Breakdown
            </CardTitle>
            <CardDescription>
              Current distribution across all orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : !data?.ordersByStatus ||
              Object.keys(data.ordersByStatus).length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No orders yet"
                description="Orders will appear here as they come in."
              />
            ) : (
              <div className="space-y-3">
                {STATUS_ORDER.filter(
                  (s) => data.ordersByStatus[s] !== undefined
                ).map((status) => {
                  const count = data.ordersByStatus[status] ?? 0;
                  const pct =
                    data.totalOrders > 0
                      ? Math.round((count / data.totalOrders) * 100)
                      : 0;
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="w-24 text-sm font-medium">
                        {cfg?.label ?? status}
                      </span>
                      <div className="flex-1 bg-muted/50 rounded-full h-2">
                        <div
                          className={`${cfg?.bg ?? "bg-muted"} rounded-full h-2 transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-[#111] border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Orders
            </CardTitle>
            <CardDescription>
              Latest 10 orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : !data?.recentOrders?.length ? (
              <EmptyState
                icon={Clock}
                title="No orders yet"
                description="Orders will appear here as they come in."
              />
            ) : (
              <div className="divide-y divide-border/50">
                {data.recentOrders.slice(0, 10).map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders?id=${order.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-muted/50 transition-colors -mx-4 px-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-sm font-medium shrink-0">
                        #{order.orderNumber}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {order.customerName ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-medium w-20 text-right">
                        {formatEur(order.totalAmount)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Recent Orders Table */}
      {!loading && data?.recentOrders?.length ? (
        <Card className="bg-[#111] border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              Order Details
            </CardTitle>
            <CardDescription>
              Most recent orders with full details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Order #</th>
                    <th className="text-left py-2 pr-4 font-medium">Customer</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-right py-2 pr-4 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.recentOrders.slice(0, 10).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/orders?id=${order.id}`}
                          className="font-mono hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4">
                        {order.customerName ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium">
                        {formatEur(order.totalAmount)}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}