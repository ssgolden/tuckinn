"use client";

import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, FolderOpen, Armchair, SlidersHorizontal, DollarSign, Activity, Clock, TrendingUp, ShoppingCart } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

type OrderItem = { name: string; quantity: number; unitPrice: number };
type Order = {
  id: string; orderNumber: string; status: string; orderKind: string;
  totalAmount: number; currencyCode: string; items: OrderItem[]; createdAt: string;
  table?: { name?: string; tableNumber: number };
};

type DashboardData = {
  categories: unknown[];
  products: unknown[];
  modifierGroups: unknown[];
  tables: unknown[];
  orders: Order[];
};

export default function DashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!session) return;
    try {
      const [categories, products, modifierGroups, tables, orders] = await Promise.all([
        apiFetch<unknown[]>("/catalog/categories?locationCode=main", undefined, session.accessToken).catch(() => []),
        apiFetch<unknown[]>("/catalog/products?locationCode=main", undefined, session.accessToken).catch(() => []),
        apiFetch<unknown[]>("/modifiers/groups?locationCode=main", undefined, session.accessToken).catch(() => []),
        apiFetch<unknown[]>("/tables?locationCode=main", undefined, session.accessToken).catch(() => []),
        apiFetch<Order[]>("/orders?locationCode=main&scope=all", undefined, session.accessToken).catch(() => []),
      ]);
      setData({ categories, products, modifierGroups, tables, orders });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const orders = data?.orders || [];
  const activeOrders = orders.filter(o => !["completed", "cancelled", "refunded"].includes(o.status));
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt?.slice(0, 10) === todayStr);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const statusGroups = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const topProducts = orders.flatMap(o => o.items || []).reduce<Record<string, { name: string; qty: number; revenue: number }>>((acc, item) => {
    if (!acc[item.name]) acc[item.name] = { name: item.name, qty: 0, revenue: 0 };
    acc[item.name].qty += item.quantity;
    acc[item.name].revenue += item.quantity * item.unitPrice;
    return acc;
  }, {});
  const topProductsSorted = Object.values(topProducts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const STATUS_LABELS: Record<string, string> = {
    pending_payment: "Pending", paid: "Paid", accepted: "Accepted",
    preparing: "Preparing", ready: "Ready", completed: "Completed",
    cancelled: "Cancelled", refunded: "Refunded",
  };

  const stats = [
    { label: "Categories", value: data ? String(data.categories.length) : "—", icon: FolderOpen },
    { label: "Products", value: data ? String(data.products.length) : "—", icon: Package },
    { label: "Modifier Groups", value: data ? String(data.modifierGroups.length) : "—", icon: SlidersHorizontal },
    { label: "Tables", value: data ? String(data.tables.length) : "—", icon: Armchair },
    { label: "Active Orders", value: String(activeOrders.length), icon: ShoppingCart },
    { label: "Today Revenue", value: `€${todayRevenue.toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your Tuckinn Proper operations.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "…" : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Order Status Breakdown</CardTitle>
            <CardDescription>Current distribution across all orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(statusGroups).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(statusGroups).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                  const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="w-24 text-sm font-medium">{STATUS_LABELS[status] || status}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top Products by Revenue</CardTitle>
            <CardDescription>Best sellers across all completed orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {topProductsSorted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No order data yet.</p>
            ) : (
              <div className="space-y-3">
                {topProductsSorted.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-6 text-sm text-muted-foreground font-mono">{i + 1}.</span>
                    <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.qty} sold</span>
                    <span className="text-sm font-medium">€{p.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Orders</CardTitle>
          <CardDescription>Latest 10 orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
          ) : (
            <div className="divide-y">
              {orders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{o.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">{o.orderKind}</span>
                    {o.table?.name && <span className="text-xs text-muted-foreground">Table {o.table.name}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium capitalize">{(STATUS_LABELS[o.status] || o.status).replace(/_/g, " ")}</span>
                    <span className="text-sm font-medium">€{(o.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}