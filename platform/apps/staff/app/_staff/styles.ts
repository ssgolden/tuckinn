import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  shell: {
    maxWidth: 1480,
    margin: "0 auto",
    padding: "32px 24px 72px",
    fontFamily: 'var(--font-ui), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  authCard: {
    maxWidth: 640,
    margin: "8vh auto 0",
    background: "linear-gradient(180deg, rgba(255,253,250,0.98), rgba(255,247,237,0.98))",
    border: "1px solid var(--staff-border)",
    borderRadius: 30,
    padding: 32,
    boxShadow: "var(--staff-shadow)"
  },
  authBrand: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    marginBottom: 20
  },
  headerBrand: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    minWidth: 0
  },
  headerLead: {
    display: "grid",
    gap: 6,
    minWidth: 0
  },
  brandLogoFrame: {
    position: "relative",
    width: 88,
    height: 88,
    borderRadius: 24,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid var(--staff-border)",
    boxShadow: "0 12px 28px rgba(127, 29, 29, 0.12)",
    flexShrink: 0
  },
  eyebrow: {
    margin: 0,
    color: "var(--staff-accent)",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    fontSize: 12,
    fontWeight: 800
  },
  heroTitle: {
    margin: "10px 0 8px",
    fontFamily: 'var(--font-display), Impact, sans-serif',
    fontSize: "clamp(2.4rem, 6vw, 4.1rem)",
    lineHeight: 0.94,
    letterSpacing: "0.03em",
    color: "var(--staff-primary-strong)",
    textTransform: "uppercase",
    fontWeight: 400
  },
  heroCopy: {
    margin: 0,
    color: "var(--staff-text-muted)",
    lineHeight: 1.6
  },
  pillRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18
  },
  infoPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    color: "var(--staff-primary-strong)",
    border: "1px solid var(--staff-border)",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  form: {
    display: "grid",
    gap: 18
  },
  label: {
    display: "grid",
    gap: 8,
    color: "var(--staff-text-muted)",
    fontSize: 14,
    fontWeight: 700
  },
  labelInline: {
    display: "grid",
    gap: 8,
    color: "var(--staff-text-muted)",
    fontSize: 14,
    fontWeight: 700,
    minWidth: 180
  },
  input: {
    borderRadius: 16,
    border: "1px solid var(--staff-border-strong)",
    background: "rgba(255,255,255,0.92)",
    color: "var(--staff-text)",
    padding: "14px 16px",
    outline: "none"
  },
  textarea: {
    minHeight: 88,
    borderRadius: 16,
    border: "1px solid var(--staff-border-strong)",
    background: "rgba(255,255,255,0.92)",
    color: "var(--staff-text)",
    padding: "12px 14px",
    resize: "vertical",
    outline: "none"
  },
  select: {
    borderRadius: 16,
    border: "1px solid var(--staff-border-strong)",
    background: "rgba(255,255,255,0.96)",
    color: "var(--staff-text)",
    padding: "12px 14px",
    outline: "none"
  },
  primaryButton: {
    border: 0,
    borderRadius: 16,
    background: "linear-gradient(135deg, var(--staff-primary), #991b1b)",
    color: "#fff",
    padding: "15px 18px",
    fontWeight: 800,
    letterSpacing: "0.02em",
    boxShadow: "0 10px 24px rgba(185, 28, 28, 0.2)",
    cursor: "pointer"
  },
  primaryButtonSmall: {
    border: 0,
    borderRadius: 14,
    background: "linear-gradient(135deg, var(--staff-primary), #991b1b)",
    color: "#fff",
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer"
  },
  secondaryButton: {
    borderRadius: 14,
    border: "1px solid var(--staff-border-strong)",
    background: "rgba(255,255,255,0.9)",
    color: "var(--staff-primary-strong)",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer"
  },
  secondaryButtonSmall: {
    borderRadius: 14,
    border: "1px solid var(--staff-border-strong)",
    background: "rgba(255,255,255,0.86)",
    color: "var(--staff-primary-strong)",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer"
  },
  ghostButton: {
    borderRadius: 14,
    border: "1px solid var(--staff-border)",
    background: "transparent",
    color: "var(--staff-text-muted)",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer"
  },
  error: {
    margin: "0 0 16px",
    color: "#991b1b",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(254, 226, 226, 0.92)",
    border: "1px solid rgba(248, 113, 113, 0.24)"
  },
  apiHint: {
    margin: 0,
    color: "var(--staff-text-dim)",
    fontSize: 12
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    marginBottom: 24,
    flexWrap: "wrap",
    padding: 24,
    borderRadius: 28,
    background: "linear-gradient(180deg, rgba(255,253,250,0.95), rgba(254,242,242,0.9))",
    border: "1px solid var(--staff-border)",
    boxShadow: "var(--staff-shadow)"
  },
  dashboardTitle: {
    margin: "10px 0 6px",
    fontFamily: 'var(--font-display), Impact, sans-serif',
    fontSize: "clamp(2.5rem, 4vw, 4rem)",
    lineHeight: 0.94,
    letterSpacing: "0.03em",
    color: "var(--staff-primary-strong)",
    textTransform: "uppercase",
    fontWeight: 400
  },
  subtleText: {
    margin: 0,
    color: "var(--staff-text-muted)",
    lineHeight: 1.55
  },
  topBarActions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap"
  },
  connectionChip: {
    padding: "10px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid transparent",
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  connectionChipLive: {
    background: "rgba(220, 252, 231, 0.92)",
    color: "#166534",
    borderColor: "rgba(74, 222, 128, 0.22)"
  },
  connectionChipOffline: {
    background: "rgba(254, 243, 199, 0.92)",
    color: "#92400e",
    borderColor: "rgba(251, 191, 36, 0.24)"
  },
  filtersPanel: {
    display: "grid",
    gap: 18,
    background: "var(--staff-panel)",
    border: "1px solid var(--staff-border)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    boxShadow: "var(--staff-shadow)"
  },
  filterRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "end"
  },
  eventCard: {
    display: "grid",
    gap: 4,
    minWidth: 260,
    padding: "12px 14px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid var(--staff-border)"
  },
  eventLabel: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--staff-accent)"
  },
  eventValue: {
    color: "var(--staff-text-muted)",
    lineHeight: 1.4
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14
  },
  metricCard: {
    padding: 18,
    borderRadius: 20,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid var(--staff-border)"
  },
  metricLabel: {
    display: "block",
    color: "var(--staff-text-muted)",
    fontSize: 13,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700
  },
  metricValue: {
    fontFamily: 'var(--font-display), Impact, sans-serif',
    fontSize: 32,
    lineHeight: 0.94,
    letterSpacing: "0.03em",
    color: "var(--staff-primary-strong)",
    fontWeight: 400
  },
  sectionsStack: {
    display: "grid",
    gap: 20
  },
  sectionPanel: {
    display: "grid",
    gap: 16
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "end"
  },
  sectionKicker: {
    margin: 0,
    color: "var(--staff-accent)",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    fontSize: 12,
    fontWeight: 800
  },
  sectionTitle: {
    margin: "6px 0 4px",
    fontFamily: 'var(--font-display), Impact, sans-serif',
    fontSize: "clamp(2rem, 3vw, 3rem)",
    lineHeight: 0.94,
    letterSpacing: "0.03em",
    color: "var(--staff-primary-strong)",
    textTransform: "uppercase",
    fontWeight: 400
  },
  sectionCopy: {
    margin: 0,
    color: "var(--staff-text-muted)",
    lineHeight: 1.5
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
    background: "var(--staff-panel)",
    border: "1px solid var(--staff-border)",
    boxShadow: "var(--staff-shadow)"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "start"
  },
  orderMetaRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap"
  },
  orderNumber: {
    margin: 0,
    fontFamily: 'var(--font-display), Impact, sans-serif',
    fontSize: 28,
    letterSpacing: "0.03em",
    color: "var(--staff-primary-strong)",
    lineHeight: 0.94,
    textTransform: "uppercase",
    fontWeight: 400
  },
  urgencyPill: {
    padding: "8px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    border: "1px solid transparent"
  },
  statusBlock: {
    display: "grid",
    justifyItems: "end",
    gap: 8
  },
  statusBadge: {
    padding: "8px 10px",
    borderRadius: 999,
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em"
  },
  timelineRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "var(--staff-text-dim)",
    fontSize: 13
  },
  itemStack: {
    display: "grid",
    gap: 10
  },
  itemRow: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.9)",
    border: "1px solid var(--staff-border)"
  },
  noteBlock: {
    display: "grid",
    gap: 6,
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(254, 243, 199, 0.76)",
    border: "1px solid rgba(202, 138, 4, 0.16)"
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },
  emptyLane: {
    padding: 24,
    borderRadius: 20,
    border: "1px dashed var(--staff-border-strong)",
    background: "rgba(255,255,255,0.78)"
  },
  emptyState: {
    padding: 32,
    borderRadius: 24,
    border: "1px dashed var(--staff-border-strong)",
    background: "rgba(255,255,255,0.78)"
  }
};

export function getStatusBadgeStyle(status: string): CSSProperties {
  const base: CSSProperties = {
    ...styles.statusBadge
  };

  if (status === "ready") {
    return { ...base, background: "rgba(220, 252, 231, 0.92)", color: "#166534" };
  }

  if (status === "preparing" || status === "accepted") {
    return { ...base, background: "rgba(254, 243, 199, 0.92)", color: "#92400e" };
  }

  if (status === "cancelled" || status === "refunded") {
    return { ...base, background: "rgba(254, 226, 226, 0.92)", color: "#991b1b" };
  }

  return { ...base, background: "rgba(255, 237, 213, 0.92)", color: "var(--staff-primary-strong)" };
}

export function getUrgencyPillStyle(tone: string): CSSProperties {
  if (tone === "urgent") {
    return {
      ...styles.urgencyPill,
      background: "rgba(254, 226, 226, 0.92)",
      color: "#991b1b"
    };
  }

  if (tone === "attention") {
    return {
      ...styles.urgencyPill,
      background: "rgba(254, 243, 199, 0.92)",
      color: "#92400e"
    };
  }

  return {
    ...styles.urgencyPill,
    background: "rgba(255,255,255,0.9)",
    color: "var(--staff-text-muted)"
  };
}

export function getOrderCardStyle(tone: string): CSSProperties {
  if (tone === "urgent") {
    return {
      ...styles.orderCard,
      borderColor: "rgba(239, 68, 68, 0.3)",
      boxShadow: "0 20px 48px rgba(185, 28, 28, 0.14)"
    };
  }

  if (tone === "attention") {
    return {
      ...styles.orderCard,
      borderColor: "rgba(202, 138, 4, 0.28)"
    };
  }

  return styles.orderCard;
}

export function getActionButtonStyle(status: string): CSSProperties {
  if (status === "cancelled") {
    return {
      ...styles.ghostButton,
      borderColor: "rgba(185, 28, 28, 0.22)",
      color: "var(--staff-primary-strong)"
    };
  }

  return styles.secondaryButtonSmall;
}
