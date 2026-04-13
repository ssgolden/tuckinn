"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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
import {
  type BoardEventPayload,
  type BoardResponse,
  type StaffScope,
  STATUS_ACTIONS,
  formatMoney,
  getElapsedLabel,
  getOrderSections,
  humanizeStatus
} from "./_staff/board";
import {
  ConfirmDialog,
  ConnectionStatusIndicator,
  MetricCard,
  OrderCard,
  SoundToggle,
  StaffAuthShell,
  type ConfirmDialogState
} from "./_staff/components";
import { styles } from "./_staff/styles";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" }
];

const KIND_OPTIONS = [
  { value: "", label: "All types" },
  { value: "dine-in", label: "Dine-in" },
  { value: "takeaway", label: "Takeaway" }
];

function playOrderBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.value = 0.3;
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not available in this environment
  }
}

export default function StaffHomePage() {
  const [session, setSession] = useState<StaffLoginResponse | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [scope, setScope] = useState<StaffScope>("active");
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteByOrderId, setNoteByOrderId] = useState<Record<string, string>>({});
  const [socketStatus, setSocketStatus] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");
  const [disconnectedAt, setDisconnectedAt] = useState<number | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [lastEventLabel, setLastEventLabel] = useState<string | null>(null);
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

  // Auto-update elapsed time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    void loadBoardWithSession(session, scope, statusFilter, kindFilter, "Board refreshed");
  }, [session, scope, statusFilter, kindFilter]);

  useEffect(() => {
    if (!session) {
      setSocketStatus("disconnected");
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token: session.accessToken }
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      setDisconnectedAt(null);
      setReconnectAttempts(0);
    });

    socket.on("disconnect", () => {
      setSocketStatus("reconnecting");
      setDisconnectedAt(Date.now());
    });

    socket.on("connect_error", () => {
      setReconnectAttempts(prev => prev + 1);
    });

    socket.on("board:refresh", (payload: BoardEventPayload) => {
      setLastRefreshAt(payload.triggeredAt ?? new Date().toISOString());
      setLastEventLabel(
        payload.source === "payments"
          ? "Storefront payment updated the board"
          : "Staff board refreshed"
      );
      void loadBoardWithSession(session, scope, statusFilter, kindFilter);
    });

    socket.on("order:updated", (payload: BoardEventPayload) => {
      setLastRefreshAt(payload.triggeredAt ?? new Date().toISOString());
      setLastEventLabel(
        payload.status
          ? `Order moved to ${humanizeStatus(payload.status)}`
          : "Order updated"
      );

      if (payload.status === "paid" && soundEnabled) {
        playOrderBeep();
      }

      void loadBoardWithSession(session, scope, statusFilter, kindFilter);
    });

    return () => {
      socket.disconnect();
      setSocketStatus("disconnected");
    };
  }, [session, scope, statusFilter, kindFilter, soundEnabled]);

  const orderSections = useMemo(
    () => getOrderSections(board?.orders ?? [], scope, statusFilter),
    [board?.orders, scope, statusFilter]
  );

  async function loadBoard(token: string, boardScope: StaffScope, boardStatus: string, boardKind: string) {
    try {
      setError(null);
      const query = new URLSearchParams();
      query.set("scope", boardScope);
      if (boardStatus) {
        query.set("status", boardStatus);
      }
      if (boardKind) {
        query.set("orderKind", boardKind);
      }

      const response = await apiFetch<BoardResponse>(
        `/fulfillment/board?${query.toString()}`,
        undefined,
        token
      );
      setBoard(response);
      setLastRefreshAt(new Date().toISOString());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load board.");
    }
  }

  async function loadBoardWithSession(
    activeSession: StaffLoginResponse,
    boardScope: StaffScope,
    boardStatus: string,
    boardKind: string,
    eventLabel?: string
  ) {
    return withStaffSession(
      activeSession,
      async accessToken => {
        await loadBoard(accessToken, boardScope, boardStatus, boardKind);
      },
      setSession
    ).finally(() => {
      if (eventLabel) {
        setLastEventLabel(eventLabel);
      }
    });
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
        setLastEventLabel("Signed in");
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
        await loadBoardWithSession(session, scope, statusFilter, kindFilter, `Marked ${humanizeStatus(status)}`);
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
      setSocketStatus("disconnected");
      setDisconnectedAt(null);
      setReconnectAttempts(0);
      setLastRefreshAt(null);
      setLastEventLabel(null);
    });
  }

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  // Keyboard shortcuts for expanded order
  useEffect(() => {
    if (!session || expandedOrderIds.size !== 1) return;

    const expandedId = [...expandedOrderIds][0];
    const expandedOrder = board?.orders.find(o => o.id === expandedId);
    if (!expandedOrder) return;

    const actions = (STATUS_ACTIONS[expandedOrder.status] ?? []);
    const keyMap: Record<string, string> = {};
    actions.forEach((status, i) => {
      keyMap[String(i + 1)] = status;
    });

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === "Escape") {
        setExpandedOrderIds(new Set());
        return;
      }

      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        setConfirmDialog({
          orderId: expandedId,
          orderNumber: expandedOrder!.orderNumber,
          nextStatus: action
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, expandedOrderIds, board?.orders]);

  async function handleConfirmAction() {
    if (!confirmDialog) {
      return;
    }
    const { orderId, nextStatus } = confirmDialog;
    setConfirmDialog(null);
    await handleStatusUpdate(orderId, nextStatus);
  }

  if (isBootstrapping) {
    return (
      <StaffAuthShell
        title="Restoring session"
        description="Checking the live order board and staff credentials."
      />
    );
  }

  if (!session) {
    return (
      <StaffAuthShell
        title="Live orders console"
        description="Sign in to accept paid orders, move tickets through preparation, and keep handoff timing visible."
      >
        <div style={styles.pillRow}>
          <span style={styles.infoPill}>Realtime board</span>
          <span style={styles.infoPill}>Kitchen workflow</span>
          <span style={styles.infoPill}>Front-of-house handoff</span>
        </div>
        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>
            Staff email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="name@example.com"
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
            {isPending ? "Signing in..." : "Open live orders"}
          </button>
          <p style={styles.apiHint}>API target: {API_BASE_URL}</p>
        </form>
      </StaffAuthShell>
    );
  }

  return (
    <main style={styles.shell}>
      {confirmDialog ? (
        <ConfirmDialog
          dialog={confirmDialog}
          isPending={isPending}
          onConfirm={() => void handleConfirmAction()}
          onCancel={() => setConfirmDialog(null)}
        />
      ) : null}

      <section style={styles.topBar}>
        <div style={styles.headerBrand}>
          <div style={styles.brandLogoFrame}>
            <Image src="/logo.jpg" alt="Tuckinn Proper logo" fill sizes="88px" priority />
          </div>
          <div style={styles.headerLead}>
            <p style={styles.eyebrow}>Tuckinn Proper Staff</p>
            <h1 style={styles.dashboardTitle}>Live orders board</h1>
            <p style={styles.subtleText}>
              Signed in as {session.user.firstName} {session.user.lastName}. Paid storefront
              orders should flow into this board live, then move through the kitchen and handoff
              stages without losing visibility.
            </p>
            <div style={styles.pillRow}>
              <span style={styles.infoPill}>
                {session.user.roles.length ? session.user.roles.join(" / ") : "staff"}
              </span>
              <ConnectionStatusIndicator
                status={socketStatus}
                disconnectedAt={disconnectedAt}
                reconnectAttempts={reconnectAttempts}
              />
              <span style={styles.infoPill}>
                {lastRefreshAt ? `Last refresh ${getElapsedLabel(lastRefreshAt, now)}` : "Waiting for first refresh"}
              </span>
              <SoundToggle
                enabled={soundEnabled}
                onToggle={() => setSoundEnabled(prev => !prev)}
              />
            </div>
          </div>
        </div>
        <div style={styles.topBarActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => void loadBoardWithSession(session, scope, statusFilter, kindFilter, "Manual refresh")}
            disabled={isPending}
          >
            Refresh board
          </button>
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
              onChange={event => setScope(event.target.value as StaffScope)}
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
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.labelInline}>
            Type
            <select
              style={styles.select}
              value={kindFilter}
              onChange={event => setKindFilter(event.target.value)}
            >
              {KIND_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div style={styles.eventCard}>
            <strong style={styles.eventLabel}>Board signal</strong>
            <span style={styles.eventValue}>
              {lastEventLabel ?? "Listening for storefront and fulfillment events"}
            </span>
          </div>
        </div>
        {board ? (
          <div style={styles.metricsGrid}>
            <MetricCard label="Orders in view" value={String(board.summary.totalOrders)} />
            <MetricCard label="Revenue in view" value={formatMoney(board.summary.totalRevenue)} />
            <MetricCard label="Awaiting action" value={String(board.summary.byStatus.paid || 0)} />
            <MetricCard label="Ready now" value={String(board.summary.byStatus.ready || 0)} />
          </div>
        ) : null}
      </section>

      {error ? <p style={styles.error}>{error}</p> : null}

      <section style={styles.sectionsStack}>
        {orderSections.length > 0 && board?.orders.length ? (
          orderSections.map(section => (
            <section key={section.key} style={styles.sectionPanel}>
              <div style={styles.sectionHead}>
                <div>
                  <p style={styles.sectionKicker}>{section.title}</p>
                  <h2 style={styles.sectionTitle}>
                    {section.orders.length} order{section.orders.length === 1 ? "" : "s"}
                  </h2>
                  <p style={styles.sectionCopy}>{section.description}</p>
                </div>
              </div>
              {section.orders.length ? (
                <div style={styles.boardGrid}>
                  {section.orders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      note={noteByOrderId[order.id] || ""}
                      isPending={isPending}
                      isExpanded={expandedOrderIds.has(order.id)}
                      now={now}
                      onNoteChange={value =>
                        setNoteByOrderId(current => ({
                          ...current,
                          [order.id]: value
                        }))
                      }
                      onAction={nextStatus =>
                        setConfirmDialog({
                          orderId: order.id,
                          orderNumber: order.orderNumber,
                          nextStatus
                        })
                      }
                      onToggleExpand={() => toggleExpand(order.id)}
                    />
                  ))}
                </div>
              ) : (
                <div style={styles.emptyLane}>
                  <strong>No orders here right now.</strong>
                  <p style={styles.subtleText}>{section.emptyCopy}</p>
                </div>
              )}
            </section>
          ))
        ) : (
          <div style={styles.emptyState}>
            <h2 style={{ margin: 0 }}>No orders in this view</h2>
            <p style={styles.subtleText}>
              Change the scope, clear the status filter, or wait for new storefront payments and
              fulfillment events to arrive.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}