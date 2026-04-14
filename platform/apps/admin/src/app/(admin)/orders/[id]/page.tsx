"use client";

import { useAuth } from "@/lib/auth-context";
import { apiFetch, withAdminSession } from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User,
  RefreshCw,
  ArrowRight,
  Printer,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  UtensilsCrossed,
  Package,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

// ── Full order type from GET /orders/:orderId ──

type OrderModifier = {
  id: string;
  modifierGroupName: string;
  modifierOptionName: string;
  priceDeltaAmount: number;
};

type OrderItem = {
  id: string;
  quantity: number;
  itemName: string;
  notes: string | null;
  unitPriceAmount: number;
  lineTotalAmount: number;
  modifiers: OrderModifier[];
  snapshot: unknown;
};

type OrderPayment = {
  id: string;
  provider: string;
  status: string;
  currencyCode: string;
  providerIntentId: string | null;
  amountAuthorized: number | null;
  amountCaptured: number | null;
  amountRefunded: number;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: string;
};

type DeliveryAddress = {
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
} | null;

type FullOrder = {
  id: string;
  orderNumber: string;
  status: string;
  orderKind: string;
  currencyCode: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  specialInstructions: string | null;
  deliveryAddress: DeliveryAddress;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  location: { id: string; code: string; name: string } | null;
  diningTable: { id: string; tableNumber: number; qrSlug: string } | null;
  items: OrderItem[];
  payments: OrderPayment[];
};

// ── Constants ──

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

const ORDER_KIND_LABELS: Record<string, { label: string; icon: typeof UtensilsCrossed }> = {
  collect: { label: "Collection", icon: ShoppingBag },
  delivery: { label: "Delivery", icon: Truck },
  dine_in: { label: "Dine In", icon: UtensilsCrossed },
};

function formatPrice(amount: number) {
  return `€${Number(amount).toFixed(2)}`;
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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

// ── Status Timeline Component ──

function StatusTimeline({ order }: { order: FullOrder }) {
  const steps: { key: string; label: string; time: string | null; icon: typeof CheckCircle2 }[] = [
    { key: "created", label: "Order Placed", time: order.createdAt, icon: Clock },
    { key: "paid", label: "Paid", time: order.acceptedAt, icon: CreditCard },
    { key: "accepted", label: "Accepted", time: order.acceptedAt, icon: CheckCircle2 },
    { key: "preparing", label: "Preparing", time: order.preparingAt, icon: Package },
    { key: "ready", label: "Ready", time: order.readyAt, icon: ShoppingBag },
    { key: "completed", label: "Completed", time: order.completedAt, icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => {
    if (s.key === "created") return false;
    return s.time === null;
  });

  const isCancelled = order.status === "cancelled";
  const isRefunded = order.status === "refunded";

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const isCompleted = step.time !== null;
        const isCurrent = i === (currentIndex === -1 ? steps.length : currentIndex) - 1;
        const Icon = step.icon;

        if (isCancelled && step.key !== "created" && !isCompleted) return null;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="mt-0.5">
              {isCompleted ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 border border-green-500/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                </div>
              ) : isCurrent ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/40 animate-pulse">
                  <Icon className="h-3.5 w-3.5 text-blue-400" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-500/10 border border-stone-500/20">
                  <Icon className="h-3.5 w-3.5 text-stone-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isCompleted ? "text-foreground" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
                {step.time && (
                  <span className="text-xs text-muted-foreground">{timeAgo(step.time)}</span>
                )}
              </div>
              {step.time && (
                <span className="text-xs text-muted-foreground">{formatDateTime(step.time)}</span>
              )}
            </div>
          </div>
        );
      })}
      {isCancelled && (
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 border border-red-500/40">
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          </div>
          <div>
            <span className="text-sm text-red-400 font-medium">Cancelled</span>
            {order.cancelledAt && (
              <div className="text-xs text-muted-foreground">{formatDateTime(order.cancelledAt)}</div>
            )}
          </div>
        </div>
      )}
      {isRefunded && (
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/40">
            <RotateCcw className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div>
            <span className="text-sm text-purple-400 font-medium">Refunded</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ──

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, updateSession } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  const loadOrder = useCallback(async () => {
    if (!session || !orderId) return;
    try {
      const data = await apiFetch<FullOrder>(
        `/orders/${orderId}`,
        undefined,
        session.accessToken
      );
      setOrder(data);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load order";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [session, orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function advanceOrder(nextStatus: string, label: string) {
    if (!session || !order) return;
    setAdvancing(true);
    try {
      await withAdminSession(
        session,
        (token) =>
          apiFetch(
            `/fulfillment/orders/${order.id}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({ status: nextStatus }),
            },
            token
          ),
        updateSession
      );
      toast.success(`Order moved to ${label}`);
      await loadOrder();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Status update failed");
    } finally {
      setAdvancing(false);
    }
  }

  async function cancelOrder() {
    if (!session || !order) return;
    setAdvancing(true);
    try {
      await withAdminSession(
        session,
        (token) =>
          apiFetch(
            `/fulfillment/orders/${order.id}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({ status: "cancelled" }),
            },
            token
          ),
        updateSession
      );
      toast.success("Order cancelled");
      setCancelDialogOpen(false);
      await loadOrder();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setAdvancing(false);
    }
  }

  async function refundOrder() {
    if (!session || !order) return;
    setAdvancing(true);
    try {
      await withAdminSession(
        session,
        (token) =>
          apiFetch(
            `/fulfillment/orders/${order.id}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({ status: "refunded" }),
            },
            token
          ),
        updateSession
      );
      toast.success("Order marked as refunded");
      setRefundDialogOpen(false);
      await loadOrder();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setAdvancing(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mr-3" />
        Loading order...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 inline mr-1.5 align-text-bottom" />
            {error || "Order not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Derived data ──

  const next = NEXT_STATUS[order.status];
  const canCancel = ["pending_payment", "paid", "accepted", "preparing"].includes(order.status);
  const canRefund = ["paid", "accepted", "preparing", "ready", "completed"].includes(order.status);
  const kindInfo = ORDER_KIND_LABELS[order.orderKind] || { label: order.orderKind, icon: Package };
  const KindIcon = kindInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[order.status] || "bg-stone-500/20 text-stone-400 border-stone-500/30"
                }`}
              >
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDateTime(order.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <KindIcon className="h-3.5 w-3.5" />
                {kindInfo.label}
              </span>
              {order.diningTable && (
                <span>Table {order.diningTable.tableNumber}</span>
              )}
              {order.location && (
                <span>{order.location.name}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={loadOrder} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items + Totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="bg-[#111] border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-primary/10 text-primary text-xs font-bold">
                          {item.quantity}
                        </span>
                        <span className="text-sm font-medium">{item.itemName}</span>
                      </div>
                      {item.notes && (
                        <div className="flex items-start gap-1.5 mt-1 ml-7">
                          <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-xs text-muted-foreground italic">{item.notes}</span>
                        </div>
                      )}
                      {item.modifiers.length > 0 && (
                        <div className="ml-7 mt-1 space-y-0.5">
                          {item.modifiers.map((mod) => (
                            <div key={mod.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{mod.modifierGroupName}: {mod.modifierOptionName}</span>
                              {mod.priceDeltaAmount > 0 && (
                                <span className="shrink-0 text-muted-foreground">+{formatPrice(mod.priceDeltaAmount)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-medium">{formatPrice(item.lineTotalAmount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(item.unitPriceAmount)} each
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-border/30" />
                </div>
              ))}

              {/* Totals */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-400">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <Card className="bg-[#111] border-border/40">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.specialInstructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Delivery Address */}
          {order.orderKind === "delivery" && order.deliveryAddress && (
            <Card className="bg-[#111] border-border/40">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-0.5">
                  <p>{order.deliveryAddress.line1}</p>
                  {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.postcode}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Customer, Timeline, Payment, Actions */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="bg-[#111] border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.customerName ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{order.customerName}</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Guest order</div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`mailto:${order.customerEmail}`} className="text-primary hover:underline">{order.customerEmail}</a>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">{order.customerPhone}</a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card className="bg-[#111] border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline order={order} />
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="bg-[#111] border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.payments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No payment records</div>
              ) : (
                order.payments.map((payment) => (
                  <div key={payment.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{payment.provider}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          payment.status === "succeeded" || payment.status === "captured"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : payment.status === "failed"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : payment.status === "refunded"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-stone-500/20 text-stone-400 border-stone-500/30"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    {payment.amountCaptured !== null && payment.amountCaptured > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Captured</span>
                        <span>{formatPrice(payment.amountCaptured)}</span>
                      </div>
                    )}
                    {payment.amountRefunded > 0 && (
                      <div className="flex items-center justify-between text-xs text-purple-400">
                        <span>Refunded</span>
                        <span>{formatPrice(payment.amountRefunded)}</span>
                      </div>
                    )}
                    {payment.failureCode && (
                      <div className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {payment.failureCode}: {payment.failureMessage || "Unknown error"}
                      </div>
                    )}
                    {payment.providerIntentId && (
                      <div className="text-xs text-muted-foreground font-mono truncate" title={payment.providerIntentId}>
                        {payment.providerIntentId}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-[#111] border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {next && (
                <Button
                  className="w-full"
                  disabled={advancing}
                  onClick={() => advanceOrder(next.status, next.label)}
                >
                  {advancing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {next.label}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  disabled={advancing}
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
              {canRefund && (
                <Button
                  variant="outline"
                  className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                  disabled={advancing}
                  onClick={() => setRefundDialogOpen(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Issue Refund
                </Button>
              )}
              {order.status === "completed" && (
                <div className="text-xs text-muted-foreground text-center pt-1">
                  Order completed — no further actions available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-[#111] border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="h-5 w-5" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order #{order.orderNumber}? This action cannot be undone.
              {order.payments.some((p) => p.status === "succeeded" || p.status === "captured") && (
                <span className="block mt-2 text-red-400">
                  This order has a successful payment. Consider issuing a refund instead.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={advancing}
              onClick={cancelOrder}
            >
              {advancing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="bg-[#111] border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <RotateCcw className="h-5 w-5" />
              Issue Refund
            </DialogTitle>
            <DialogDescription>
              Mark order #{order.orderNumber} as refunded? This will update the order status.
              The actual Stripe refund must be processed separately in your Stripe dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRefundDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={advancing}
              onClick={refundOrder}
            >
              {advancing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Mark Refunded
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}