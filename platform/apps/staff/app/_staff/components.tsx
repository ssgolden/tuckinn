import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { BoardOrder } from "./board";
import {
  STATUS_ACTIONS,
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

export type ConfirmDialogState = {
  orderId: string;
  orderNumber: string;
  nextStatus: string;
};

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

export function ConfirmDialog({
  dialog,
  isPending,
  onConfirm,
  onCancel
}: {
  dialog: ConfirmDialogState;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={styles.confirmOverlay} onClick={onCancel}>
      <div style={styles.confirmDialog} onClick={event => event.stopPropagation()}>
        <h3 style={styles.confirmTitle}>Confirm status change</h3>
        <p style={styles.confirmMessage}>
          Are you sure you want to mark order #{dialog.orderNumber} as {humanizeStatus(dialog.nextStatus)}?
        </p>
        <div style={styles.confirmActions}>
          <button style={styles.secondaryButtonSmall} onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button style={styles.primaryButtonSmall} onClick={onConfirm} disabled={isPending}>
            {isPending ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConnectionStatusIndicator({
  status,
  disconnectedAt,
  reconnectAttempts
}: {
  status: "connected" | "reconnecting" | "disconnected";
  disconnectedAt: number | null;
  reconnectAttempts: number;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status === "connected") {
      return;
    }
    const timer = setInterval(() => setTick(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const isLongDisconnect =
    status !== "connected" && disconnectedAt !== null && Date.now() - disconnectedAt > 10000;

  const dotColor =
    status === "connected"
      ? "#22c55e"
      : isLongDisconnect
        ? "#ef4444"
        : "#eab308";

  const chipStyle: React.CSSProperties = {
    ...styles.connectionRow,
    ...(isLongDisconnect
      ? { background: "rgba(254, 226, 226, 0.92)", color: "#991b1b", borderColor: "rgba(248, 113, 113, 0.24)" }
      : status === "connected"
        ? styles.connectionChipLive
        : styles.connectionChipOffline)
  };

  const label =
    status === "connected"
      ? "Connected"
      : isLongDisconnect
        ? `Disconnected${reconnectAttempts > 0 ? ` (${reconnectAttempts} attempts)` : ""}`
        : "Reconnecting...";

  return (
    <span style={chipStyle}>
      <span style={{ ...styles.connectionDot, background: dotColor }} />
      {label}
    </span>
  );
}

export function SoundToggle({
  enabled,
  onToggle
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      style={{
        ...styles.soundToggle,
        background: enabled ? "rgba(220, 252, 231, 0.92)" : "rgba(255,255,255,0.86)",
        color: enabled ? "#166534" : "var(--staff-text-muted)",
        borderColor: enabled ? "rgba(74, 222, 128, 0.22)" : "var(--staff-border)"
      }}
      onClick={onToggle}
    >
      {enabled ? "\u266A Sound on" : "\u266A Sound off"}
    </button>
  );
}

export function OrderCard({
  order,
  note,
  isPending,
  isExpanded,
  now,
  onNoteChange,
  onAction,
  onToggleExpand
}: {
  order: BoardOrder;
  note: string;
  isPending: boolean;
  isExpanded: boolean;
  now: number;
  onNoteChange: (value: string) => void;
  onAction: (status: string) => void;
  onToggleExpand: () => void;
}) {
  const primaryAction = getPrimaryAction(order);
  const secondaryActions = getSecondaryActions(order);
  const urgencyTone = getUrgencyTone(order, now);

  const itemsSummary = order.items
    .map(item => `${item.quantity}x ${item.itemName}`)
    .join(", ");

  const hasCustomerContact = order.customerPhone || order.customerEmail;
  const hasExpandDetails = order.items.some(item => item.modifiers.length > 0 || item.notes) ||
    order.specialInstructions ||
    hasCustomerContact ||
    order.deliveryAddress;

  return (
    <article style={getOrderCardStyle(urgencyTone)}>
      <div style={styles.orderHeader}>
        <div>
          <div style={styles.orderMetaRow}>
            <p style={styles.orderNumber}>{order.orderNumber}</p>
            <span style={getUrgencyPillStyle(urgencyTone)}>{getUrgencyLabel(order, now)}</span>
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
        <span>{getElapsedLabel(order.createdAt, now)}</span>
        <span>{formatTimestamp(order.createdAt)}</span>
      </div>

      {isExpanded ? null : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <p style={styles.itemsSummary}>{itemsSummary}</p>
          {hasExpandDetails ? (
            <button style={styles.expandButton} onClick={onToggleExpand}>
              Details &#9662;
            </button>
          ) : null}
        </div>
      )}

      {isExpanded || !hasExpandDetails ? null : (
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
        </div>
      )}

      <div className={`order-expand${isExpanded ? " expanded" : ""}`}>
        <div>
          <div style={styles.expandContentInner}>
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

            {hasCustomerContact ? (
              <div style={styles.customerContact}>
                <strong>Contact</strong>
                {order.customerPhone ? <span>{order.customerPhone}</span> : null}
                {order.customerEmail ? <span>{order.customerEmail}</span> : null}
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={styles.actionRow}>
                {primaryAction ? (
                  <button
                    style={styles.primaryButtonSmall}
                    onClick={() => onAction(primaryAction)}
                    disabled={isPending}
                    title="Press 1 for this action"
                  >
                    Mark {humanizeStatus(primaryAction)} <span style={{ opacity: 0.5, fontSize: 11 }}>[1]</span>
                  </button>
                ) : null}
                {secondaryActions.map((nextStatus, i) => (
                  <button
                    key={nextStatus}
                    style={getActionButtonStyle(nextStatus)}
                    onClick={() => onAction(nextStatus)}
                    disabled={isPending}
                    title={`Press ${i + 2} for this action`}
                  >
                    Mark {humanizeStatus(nextStatus)} <span style={{ opacity: 0.5, fontSize: 11 }}>[{i + 2}]</span>
                  </button>
                ))}
              </div>
              <button style={styles.expandButton} onClick={onToggleExpand}>
                Collapse &#9652;
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}