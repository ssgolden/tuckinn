"use client";

import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, FolderOpen, Armchair, SlidersHorizontal, DollarSign, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type DashboardData = {
  categories: unknown[];
  products: unknown[];
  modifierGroups: unknown[];
};

export default function DashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const [categories, products, modifierGroups] = await Promise.all([
          apiFetch<unknown[]>("/catalog/categories?locationCode=main", undefined, session.accessToken),
          apiFetch<unknown[]>("/catalog/products?locationCode=main", undefined, session.accessToken),
          apiFetch<unknown[]>("/modifiers/groups?locationCode=main", undefined, session.accessToken),
        ]);
        setData({ categories, products, modifierGroups });
      } catch {
        // API not available — show placeholder counts
        setData({
          categories: Array(6).fill(null),
          products: Array(34).fill(null),
          modifierGroups: Array(6).fill(null),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  const stats = [
    {
      label: "Categories",
      value: data ? String(data.categories.length) : "—",
      icon: FolderOpen,
    },
    {
      label: "Products",
      value: data ? String(data.products.length) : "—",
      icon: Package,
    },
    {
      label: "Modifier Groups",
      value: data ? String(data.modifierGroups.length) : "—",
      icon: SlidersHorizontal,
    },
    {
      label: "Tables",
      value: "15",
      icon: Armchair,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Tuckinn Proper operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "…" : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome back! 👋</CardTitle>
          <CardDescription>
            Your Tuckinn Proper admin panel. Use the sidebar to manage
            categories, products, modifiers, orders, tables, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm">
              📊 Full analytics dashboard (revenue charts, order stats, peak hours) coming in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}