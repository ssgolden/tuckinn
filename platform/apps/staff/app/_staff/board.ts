export type BoardOrder = {
  id: string;
  orderNumber: string;
  status: string;
  orderKind: string;
  customerName: string;
  specialInstructions?: string | null;
  deliveryAddress?: {
    line1: string;
    line2?: string | null;
    city: string;
    postcode: string;
  } | null;
  totalAmount: number;
  createdAt: string;
  acceptedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  diningTable: { tableNumber: number } | null;
  items: Array<{
    id: string;
    quantity: number;
    itemName: string;
    notes?: string | null;
    modifiers: Array<{
      id: string;
      modifierGroupName: string;
      modifierOptionName: string;
    }>;
  }>;
};

export type BoardResponse = {
  scope: string;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
  };
  orders: BoardOrder[];
};

export type StaffScope = "active" | "history" | "all";

export type BoardEventPayload = {
  triggeredAt?: string;
  source?: "payments" | "fulfillment";
  orderId?: string;
  status?: string;
};

export type OrderSection = {
  key: string;
  title: string;
  description: string;
  emptyCopy: string;
  orders: BoardOrder[];
};

export const STATUS_ACTIONS: Record<string, string[]> = {
  paid: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
  refunded: []
};

const ACTIVE_SECTIONS: Array<Omit<OrderSection, "orders"> & { statuses: string[] }> = [
  {
    key: "awaiting",
    title: "Awaiting action",
    description: "Paid orders that still need the team to accept them.",
    emptyCopy: "No newly paid orders are waiting for action.",
    statuses: ["paid"]
  },
  {
    key: "progress",
    title: "In progress",
    description: "Orders the team has accepted and is actively preparing.",
    emptyCopy: "Nothing is currently being prepared.",
    statuses: ["accepted", "preparing"]
  },
  {
    key: "ready",
    title: "Ready for handoff",
    description: "Orders ready for collection, table service, or final handoff.",
    emptyCopy: "No orders are waiting to be handed over.",
    statuses: ["ready"]
  }
];

const HISTORY_SECTIONS: Array<Omit<OrderSection, "orders"> & { statuses: string[] }> = [
  {
    key: "completed",
    title: "Completed",
    description: "Orders that have been fully handed over or completed.",
    emptyCopy: "No completed orders in this view.",
    statuses: ["completed"]
  },
  {
    key: "cancelled",
    title: "Cancelled",
    description: "Orders cancelled before completion.",
    emptyCopy: "No cancelled orders in this view.",
    statuses: ["cancelled", "refunded"]
  }
];

export function humanizeStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function formatMoney(value: number) {
  return `EUR ${Number(value ?? 0).toFixed(2)}`;
}

export function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(date);
}

export function getElapsedMinutes(value?: string | null) {
  if (!value) {
    return 0;
  }

  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
}

export function getElapsedLabel(value?: string | null) {
  const minutes = getElapsedMinutes(value);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr ago`;
  }

  return `${hours} hr ${remainingMinutes} min ago`;
}

export function getUrgencyTone(order: BoardOrder) {
  const minutes = getElapsedMinutes(order.createdAt);

  if ((order.status === "paid" && minutes >= 8) || (order.status === "ready" && minutes >= 10)) {
    return "urgent";
  }

  if (
    (order.status === "accepted" && minutes >= 10) ||
    (order.status === "preparing" && minutes >= 14)
  ) {
    return "attention";
  }

  return "normal";
}

export function getUrgencyLabel(order: BoardOrder) {
  const tone = getUrgencyTone(order);

  if (tone === "urgent") {
    return "Needs attention";
  }

  if (tone === "attention") {
    return "Watch timing";
  }

  return "On pace";
}

export function sortOrdersForDisplay(orders: BoardOrder[]) {
  return [...orders].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    return leftTime - rightTime;
  });
}

export function getOrderSections(
  orders: BoardOrder[],
  scope: StaffScope,
  statusFilter: string
): OrderSection[] {
  if (statusFilter) {
    return [
      {
        key: statusFilter,
        title: humanizeStatus(statusFilter),
        description: "Filtered orders for the selected status.",
        emptyCopy: `No ${humanizeStatus(statusFilter)} orders match the current view.`,
        orders: sortOrdersForDisplay(orders)
      }
    ];
  }

  const sourceSections = scope === "history" ? HISTORY_SECTIONS : ACTIVE_SECTIONS;
  const grouped = sourceSections.map(section => ({
    key: section.key,
    title: section.title,
    description: section.description,
    emptyCopy: section.emptyCopy,
    orders: sortOrdersForDisplay(
      orders.filter(order => section.statuses.includes(order.status))
    )
  }));

  if (scope === "all") {
    const knownStatuses = new Set([...ACTIVE_SECTIONS, ...HISTORY_SECTIONS].flatMap(section => section.statuses));
    const otherOrders = sortOrdersForDisplay(
      orders.filter(order => !knownStatuses.has(order.status))
    );

    if (otherOrders.length > 0) {
      grouped.push({
        key: "other",
        title: "Other states",
        description: "Orders outside the main active and history lanes.",
        emptyCopy: "No additional order states in this view.",
        orders: otherOrders
      });
    }
  }

  return grouped;
}

export function getPrimaryAction(order: BoardOrder) {
  return STATUS_ACTIONS[order.status]?.[0] ?? null;
}

export function getSecondaryActions(order: BoardOrder) {
  return (STATUS_ACTIONS[order.status] ?? []).slice(1);
}
