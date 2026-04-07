"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { io } from "socket.io-client";
import {
  API_BASE_URL,
  SOCKET_BASE_URL,
  apiFetch,
  logoutStaffSession,
  restoreStaffSession,
  saveStaffSession,
  withStaffSession,
  type StaffLoginResponse
} from "../lib/api";

type BoardOrder = {
  id: string;
  orderNumber: string;
  status: string;
  orderKind: string;
  customerName: string;
  specialInstructions?: string | null;
  totalAmount: number;
  createdAt: string;
  diningTable: { tableNumber: number } | null;
  items: Array<{
    id: string;
    quantity: number;
    itemName: string;
    modifiers: Array<{
      id: string;
      modifierGroupName: string;
      modifierOptionName: string;
    }>;
  }>;
};

type BoardResponse = {
  scope: string;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
  };
  orders: BoardOrder[];
};

const STATUS_ACTIONS: Record<string, string[]> = {
  paid: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: []
};

export default function StaffHomePage() {
  const [session, setSession] = useState<StaffLoginResponse | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [scope, setScope] = useState<"active" | "history" | "all">("active");
  const [statusFilter, setStatusFilter] = useState("");
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteByOrderId, setNoteByOrderId] = useState<Record<string, string>>({});
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      try {
        const existingSession = await restoreStaffSession();
        if (existingSession) {
          setSession(existingSession);
        }
      } catch (restoreError) {
        setError(
          restoreError instanceof Error
            ? restoreError.message
            : "Failed to restore staff session."
        );
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadBoardWithSession(session, scope, statusFilter);
  }, [session, scope, statusFilter]);

  useEffect(() => {
    if (!session) {
      setIsRealtimeConnected(false);
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true
    });

    socket.on("connect", () => {
      setIsRealtimeConnected(true);
    });

    socket.on("disconnect", () => {
      setIsRealtimeConnected(false);
    });

    socket.on("board:refresh", () => {
      void loadBoardWithSession(session, scope, statusFilter);
    });

    socket.on("order:updated", () => {
      void loadBoardWithSession(session, scope, statusFilter);
    });

    return () => {
      socket.disconnect();
      setIsRealtimeConnected(false);
    };
  }, [session, scope, statusFilter]);

  async function loadBoard(token: string, boardScope: string, boardStatus: string) {
    try {
      setError(null);
      const query = new URLSearchParams();
      query.set("scope", boardScope);
      if (boardStatus) {
        query.set("status", boardStatus);
      }

      const response = await apiFetch<BoardResponse>(
        `/fulfillment/board?${query.toString()}`,
        undefined,
        token
      );
      setBoard(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load board.");
    }
  }

  async function loadBoardWithSession(
    activeSession: StaffLoginResponse,
    boardScope: string,
    boardStatus: string
  ) {
    return withStaffSession(
      activeSession,
      async accessToken => {
        await loadBoard(accessToken, boardScope, boardStatus);
      },
      setSession
    );
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await apiFetch<StaffLoginResponse>("/auth/staff/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password
          })
        });

        saveStaffSession(response);
        setSession(response);
        setPassword("");
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : "Login failed.");
      }
    });
  }

  async function handleStatusUpdate(orderId: string, status: string) {
    if (!session) {
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        await withStaffSession(
          session,
          async accessToken =>
            apiFetch(
              `/fulfillment/orders/${orderId}/status`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  status,
                  note: noteByOrderId[orderId] || undefined
                })
              },
              accessToken
            ),
          setSession
        );
      } catch (updateError) {
        setError(
          updateError instanceof Error ? updateError.message : "Status update failed."
        );
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logoutStaffSession(session);
      setSession(null);
      setBoard(null);
      setError(null);
      setIsRealtimeConnected(false);
    });
  }

  if (isBootstrapping) {
    return (
      <main style={styles.shell}>
        <section style={styles.authCard}>
          <p style={styles.eyebrow}>Tuckinn Operations</p>
          <h1 style={styles.heroTitle}>Restoring session</h1>
          <p style={styles.heroCopy}>Checking staff authentication against the API.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={styles.shell}>
        <section style={styles.authCard}>
          <p style={styles.eyebrow}>Tuckinn Operations</p>
          <h1 style={styles.heroTitle}>Staff Console</h1>
          <p style={styles.heroCopy}>
            Sign in to manage active tickets, update kitchen progress, and keep service
            flow clean.
          </p>
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>
              Staff email
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="staff@tuckinn.local"
                required
              />
            </label>
            <label style={styles.label}>
              Password
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>
            {error ? <p style={styles.error}>{error}</p> : null}
            <button style={styles.primaryButton} type="submit" disabled={isPending}>
              {isPending ? "Signing in..." : "Open Staff Console"}
            </button>
            <p style={styles.apiHint}>API target: {API_BASE_URL}</p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.shell}>
      <section style={styles.topBar}>
        <div>
          <p style={styles.eyebrow}>Kitchen + Front of House</p>
          <h1 style={styles.dashboardTitle}>Live Fulfillment Board</h1>
          <p style={styles.subtleText}>
            Signed in as {session.user.firstName} {session.user.lastName}
          </p>
        </div>
        <div style={styles.topBarActions}>
          <span style={styles.userChip}>
            {session.user.roles.length ? session.user.roles.join(" / ") : "staff"}
          </span>
          <button style={styles.secondaryButton} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </section>

      <section style={styles.filtersPanel}>
        <div style={styles.filterRow}>
          <label style={styles.labelInline}>
            Scope
            <select
              style={styles.select}
              value={scope}
              onChange={event => setScope(event.target.value as "active" | "history" | "all")}
            >
              <option value="active">Active board</option>
              <option value="history">History</option>
              <option value="all">All orders</option>
            </select>
          </label>
          <label style={styles.labelInline}>
            Status
            <select
              style={styles.select}
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <button
            style={styles.secondaryButton}
            onClick={() => void loadBoardWithSession(session, scope, statusFilter)}
            disabled={isPending}
          >
            Refresh
          </button>
          <span
            style={{
              ...styles.connectionChip,
              ...(isRealtimeConnected ? styles.connectionChipLive : styles.connectionChipOffline)
            }}
          >
            {isRealtimeConnected ? "Live updates connected" : "Live updates reconnecting"}
          </span>
        </div>
        {board ? (
          <div style={styles.metricsGrid}>
            <MetricCard label="Orders in view" value={String(board.summary.totalOrders)} />
            <MetricCard
              label="Revenue in view"
              value={`EUR ${board.summary.totalRevenue.toFixed(2)}`}
            />
            <MetricCard label="Preparing" value={String(board.summary.byStatus.preparing || 0)} />
            <MetricCard label="Ready" value={String(board.summary.byStatus.ready || 0)} />
          </div>
        ) : null}
      </section>

      {error ? <p style={styles.error}>{error}</p> : null}

      <section style={styles.boardGrid}>
        {board?.orders.length ? (
          board.orders.map(order => (
            <article key={order.id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <div>
                  <p style={styles.orderNumber}>{order.orderNumber}</p>
                  <p style={styles.subtleText}>
                    {order.customerName} - {order.orderKind}
                    {order.diningTable ? ` - Table ${order.diningTable.tableNumber}` : ""}
                  </p>
                </div>
                <div style={styles.statusBlock}>
                  <span style={getStatusBadgeStyle(order.status)}>{order.status}</span>
                  <strong>{`EUR ${order.totalAmount.toFixed(2)}`}</strong>
                </div>
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
                            .join(" - ")}
                        </p>
                      ) : null}
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

              <label style={styles.label}>
                Staff note
                <textarea
                  style={styles.textarea}
                  value={noteByOrderId[order.id] || ""}
                  onChange={event =>
                    setNoteByOrderId(current => ({
                      ...current,
                      [order.id]: event.target.value
                    }))
                  }
                  placeholder="Optional note for this status change"
                />
              </label>

              <div style={styles.actionRow}>
                {(STATUS_ACTIONS[order.status] || []).map(nextStatus => (
                  <button
                    key={nextStatus}
                    style={getActionButtonStyle(nextStatus)}
                    onClick={() => void handleStatusUpdate(order.id, nextStatus)}
                    disabled={isPending}
                  >
                    Mark {nextStatus}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div style={styles.emptyState}>
            <h2 style={{ margin: 0 }}>No orders in this view</h2>
            <p style={styles.subtleText}>
              Change the scope or wait for new payment and fulfillment events to arrive.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
}

function getStatusBadgeStyle(status: string) {
  const base = {
    ...styles.statusBadge
  };

  if (status === "ready") {
    return { ...base, background: "rgba(59,178,115,0.18)", color: "#89e3b0" };
  }

  if (status === "preparing") {
    return { ...base, background: "rgba(242,169,59,0.16)", color: "#f8c66e" };
  }

  if (status === "cancelled") {
    return { ...base, background: "rgba(198,59,45,0.18)", color: "#ff8f82" };
  }

  return base;
}

function getActionButtonStyle(status: string) {
  if (status === "cancelled") {
    return {
      ...styles.ghostButton,
      borderColor: "rgba(198,59,45,0.4)",
      color: "#ffb1a9"
    };
  }

  return styles.primaryButtonSmall;
}

const styles: Record<string, CSSProperties> = {
  shell: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "32px 24px 64px"
  },
  authCard: {
    maxWidth: 540,
    margin: "12vh auto 0",
    background: "linear-gradient(180deg, rgba(38,24,24,0.94), rgba(22,14,14,0.96))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 28,
    padding: 32,
    boxShadow: "0 28px 70px rgba(0,0,0,0.35)"
  },
  eyebrow: {
    margin: 0,
    color: "#f08a7d",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    fontSize: 12
  },
  heroTitle: {
    margin: "12px 0 8px",
    fontSize: "clamp(2.4rem, 6vw, 4rem)",
    lineHeight: 1
  },
  heroCopy: {
    margin: 0,
    color: "#b9a8a1",
    lineHeight: 1.6
  },
  form: {
    display: "grid",
    gap: 18,
    marginTop: 28
  },
  label: {
    display: "grid",
    gap: 8,
    color: "#e5d5cf",
    fontSize: 14
  },
  labelInline: {
    display: "grid",
    gap: 8,
    color: "#e5d5cf",
    fontSize: 14,
    minWidth: 180
  },
  input: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "#f7f0e8",
    padding: "14px 16px"
  },
  textarea: {
    minHeight: 88,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "#f7f0e8",
    padding: "12px 14px",
    resize: "vertical"
  },
  select: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#211414",
    color: "#f7f0e8",
    padding: "12px 14px"
  },
  primaryButton: {
    border: 0,
    borderRadius: 16,
    background: "linear-gradient(135deg, #c63b2d, #e34c3b)",
    color: "white",
    padding: "15px 18px",
    fontWeight: 700
  },
  primaryButtonSmall: {
    border: 0,
    borderRadius: 12,
    background: "linear-gradient(135deg, #c63b2d, #e34c3b)",
    color: "white",
    padding: "10px 14px",
    fontWeight: 700
  },
  secondaryButton: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#f7f0e8",
    padding: "12px 16px"
  },
  ghostButton: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    color: "#f7f0e8",
    padding: "10px 14px"
  },
  error: {
    margin: 0,
    color: "#ff9f95"
  },
  apiHint: {
    margin: 0,
    color: "#8e7c75",
    fontSize: 12
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    marginBottom: 24,
    flexWrap: "wrap"
  },
  dashboardTitle: {
    margin: "10px 0 6px",
    fontSize: "clamp(2.1rem, 4vw, 3.6rem)",
    lineHeight: 1
  },
  subtleText: {
    margin: 0,
    color: "#b9a8a1",
    lineHeight: 1.5
  },
  topBarActions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap"
  },
  userChip: {
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    color: "#dfcec7",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  connectionChip: {
    padding: "12px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid transparent"
  },
  connectionChipLive: {
    background: "rgba(59,178,115,0.14)",
    color: "#9ce6bc",
    borderColor: "rgba(59,178,115,0.28)"
  },
  connectionChipOffline: {
    background: "rgba(242,169,59,0.14)",
    color: "#f4c877",
    borderColor: "rgba(242,169,59,0.24)"
  },
  filtersPanel: {
    display: "grid",
    gap: 18,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24
  },
  filterRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "end"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14
  },
  metricCard: {
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  metricLabel: {
    display: "block",
    color: "#b9a8a1",
    fontSize: 13,
    marginBottom: 10
  },
  metricValue: {
    fontSize: 28
  },
  boardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18
  },
  orderCard: {
    display: "grid",
    gap: 16,
    padding: 22,
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(33,20,20,0.98), rgba(20,13,13,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 22px 40px rgba(0,0,0,0.18)"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "start"
  },
  orderNumber: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800
  },
  statusBlock: {
    display: "grid",
    justifyItems: "end",
    gap: 8
  },
  statusBadge: {
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    textTransform: "capitalize",
    fontSize: 12,
    letterSpacing: "0.08em"
  },
  itemStack: {
    display: "grid",
    gap: 10
  },
  itemRow: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)"
  },
  noteBlock: {
    display: "grid",
    gap: 6,
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(198,59,45,0.08)",
    border: "1px solid rgba(198,59,45,0.14)"
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },
  emptyState: {
    padding: 32,
    borderRadius: 24,
    border: "1px dashed rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.025)"
  }
};
