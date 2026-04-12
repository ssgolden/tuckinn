import Image from "next/image";
import type { ReactNode } from "react";
import type { BoardOrder } from "./board";
import {
  formatMoney,
  formatTimestamp,
  getElapsedLabel,
  getPrimaryAction,
  getSecondaryActions,
  getUrgencyLabel,
  getUrgencyTone,
  humanizeStatus
} from "./board";
import {
  getActionButtonStyle,
  getOrderCardStyle,
  getStatusBadgeStyle,
  getUrgencyPillStyle,
  styles
} from "./styles";

export function StaffAuthShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main style={styles.shell}>
      <section style={styles.authCard}>
        <div style={styles.authBrand}>
          <div style={styles.brandLogoFrame}>
            <Image src="/logo.jpg" alt="Tuckinn Proper logo" fill sizes="88px" priority />
          </div>
          <div>
            <p style={styles.eyebrow}>Tuckinn Proper Staff</p>
            <h1 style={styles.heroTitle}>{title}</h1>
            <p style={styles.heroCopy}>{description}</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
}

export function OrderCard({
  order,
  note,
  isPending,
  onNoteChange,
  onAction
}: {
  order: BoardOrder;
  note: string;
  isPending: boolean;
  onNoteChange: (value: string) => void;
  onAction: (status: string) => void;
}) {
  const primaryAction = getPrimaryAction(order);
  const secondaryActions = getSecondaryActions(order);
  const urgencyTone = getUrgencyTone(order);

  return (
    <article style={getOrderCardStyle(urgencyTone)}>
      <div style={styles.orderHeader}>
        <div>
          <div style={styles.orderMetaRow}>
            <p style={styles.orderNumber}>{order.orderNumber}</p>
            <span style={getUrgencyPillStyle(urgencyTone)}>{getUrgencyLabel(order)}</span>
          </div>
          <p style={styles.subtleText}>
            {order.customerName} | {humanizeStatus(order.orderKind)}
            {order.diningTable ? ` | Table ${order.diningTable.tableNumber}` : ""}
          </p>
        </div>
        <div style={styles.statusBlock}>
          <span style={getStatusBadgeStyle(order.status)}>{humanizeStatus(order.status)}</span>
          <strong>{formatMoney(order.totalAmount)}</strong>
        </div>
      </div>

      <div style={styles.timelineRow}>
        <span>{getElapsedLabel(order.createdAt)}</span>
        <span>{formatTimestamp(order.createdAt)}</span>
      </div>

      <div style={styles.itemStack}>
        {order.items.map(item => (
          <div key={item.id} style={styles.itemRow}>
            <div>
              <strong>
                {item.quantity}x {item.itemName}
              </strong>
              {item.modifiers.length ? (
                <p style={styles.subtleText}>
                  {item.modifiers
                    .map(
                      modifier =>
                        `${modifier.modifierGroupName}: ${modifier.modifierOptionName}`
                    )
                    .join(" | ")}
                </p>
              ) : null}
              {item.notes ? <p style={styles.subtleText}>Item note: {item.notes}</p> : null}
            </div>
          </div>
        ))}
      </div>

      {order.specialInstructions ? (
        <div style={styles.noteBlock}>
          <strong>Special instructions</strong>
          <p style={styles.subtleText}>{order.specialInstructions}</p>
        </div>
      ) : null}

      {order.deliveryAddress ? (
        <div style={styles.noteBlock}>
          <strong>Delivery address</strong>
          <p style={styles.subtleText}>
            {[order.deliveryAddress.line1, order.deliveryAddress.line2]
              .filter(Boolean)
              .join(", ")}
            <br />
            {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
          </p>
        </div>
      ) : null}

      <label style={styles.label}>
        Staff note
        <textarea
          style={styles.textarea}
          value={note}
          onChange={event => onNoteChange(event.target.value)}
          placeholder="Optional note for the next status change"
        />
      </label>

      <div style={styles.actionRow}>
        {primaryAction ? (
          <button
            style={styles.primaryButtonSmall}
            onClick={() => onAction(primaryAction)}
            disabled={isPending}
          >
            Mark {humanizeStatus(primaryAction)}
          </button>
        ) : null}
        {secondaryActions.map(nextStatus => (
          <button
            key={nextStatus}
            style={getActionButtonStyle(nextStatus)}
            onClick={() => onAction(nextStatus)}
            disabled={isPending}
          >
            Mark {humanizeStatus(nextStatus)}
          </button>
        ))}
      </div>
    </article>
  );
}
