export type CurrencyCode = "EUR";

export type OrderType = "collect" | "instore" | "delivery";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded";
