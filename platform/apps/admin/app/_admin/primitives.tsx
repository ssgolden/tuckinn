import type { CSSProperties, ReactNode } from "react";

export function Panel({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  required?: boolean;
}) {
  return (
    <label style={styles.label}>
      {label}
      <input
        style={styles.input}
        type={type}
        required={required}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.label}>
      {label}
      <textarea
        style={styles.textarea}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={styles.label}>
      {label}
      <select style={styles.select} value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxInput({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={styles.checkboxLabel}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function FileInput({
  label,
  onChange
}: {
  label: string;
  onChange: (file: File) => void;
}) {
  return (
    <label style={styles.label}>
      {label}
      <input
        style={styles.input}
        type="file"
        accept="image/*"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) {
            onChange(file);
          }
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

export function formatCurrency(value: number | string) {
  const amount = Number(value ?? 0);
  return `EUR ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
}

const uiFont = 'var(--font-ui), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const displayFont = 'var(--font-display), Impact, sans-serif';

export const styles: Record<string, CSSProperties> = {
  shell: {
    maxWidth: 1480,
    margin: "0 auto",
    padding: "32px 24px 72px",
    fontFamily: uiFont
  },
  authCard: {
    maxWidth: 620,
    margin: "8vh auto 0",
    padding: 32,
    borderRadius: 30,
    background: "linear-gradient(180deg, rgba(255,253,250,0.98), rgba(255,247,237,0.98))",
    border: "1px solid var(--admin-border)",
    boxShadow: "var(--admin-shadow)"
  },
  authBrand: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    marginBottom: 18
  },
  brandLogoFrame: {
    position: "relative",
    width: 86,
    height: 86,
    borderRadius: 24,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid var(--admin-border)",
    boxShadow: "0 12px 28px rgba(127, 29, 29, 0.12)",
    flexShrink: 0
  },
  headerBrand: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    minWidth: 0
  },
  eyebrow: {
    margin: 0,
    color: "var(--admin-accent)",
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    fontSize: 12,
    fontWeight: 800
  },
  heroTitle: {
    margin: "10px 0 8px",
    fontFamily: displayFont,
    fontSize: "clamp(2.4rem, 4vw, 4.1rem)",
    lineHeight: 0.94,
    letterSpacing: "0.03em",
    color: "var(--admin-primary-strong)",
    textTransform: "uppercase",
    fontWeight: 400
  },
  mutedText: {
    margin: 0,
    color: "var(--admin-text-muted)",
    lineHeight: 1.55
  },
  statusPillRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(202, 138, 4, 0.12)",
    border: "1px solid rgba(202, 138, 4, 0.22)",
    color: "var(--admin-primary-strong)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase"
  },
  form: {
    display: "grid",
    gap: 16
  },
  label: {
    display: "grid",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "var(--admin-text-muted)"
  },
  checkboxLabel: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    color: "var(--admin-text-muted)",
    fontSize: 14,
    fontWeight: 700
  },
  input: {
    borderRadius: 16,
    border: "1px solid var(--admin-border-strong)",
    background: "rgba(255,255,255,0.9)",
    color: "var(--admin-text)",
    padding: "14px 16px",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)"
  },
  textarea: {
    minHeight: 90,
    borderRadius: 16,
    border: "1px solid var(--admin-border-strong)",
    background: "rgba(255,255,255,0.9)",
    color: "var(--admin-text)",
    padding: "14px 16px",
    resize: "vertical",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)"
  },
  select: {
    borderRadius: 16,
    border: "1px solid var(--admin-border-strong)",
    background: "rgba(255,255,255,0.96)",
    color: "var(--admin-text)",
    padding: "14px 16px",
    outline: "none"
  },
  primaryButton: {
    border: 0,
    borderRadius: 16,
    background: "linear-gradient(135deg, var(--admin-primary), #991b1b)",
    color: "white",
    padding: "14px 16px",
    fontWeight: 800,
    letterSpacing: "0.02em",
    boxShadow: "0 10px 24px rgba(185, 28, 28, 0.2)",
    cursor: "pointer"
  },
  secondaryButton: {
    borderRadius: 14,
    border: "1px solid var(--admin-border-strong)",
    background: "rgba(255,255,255,0.86)",
    color: "var(--admin-primary-strong)",
    padding: "12px 15px",
    fontWeight: 700,
    cursor: "pointer"
  },
  dangerButton: {
    borderRadius: 14,
    border: "1px solid rgba(185,28,28,0.24)",
    background: "rgba(185, 28, 28, 0.08)",
    color: "var(--admin-primary-strong)",
    padding: "12px 15px",
    fontWeight: 700,
    cursor: "pointer"
  },
  error: {
    color: "#991b1b",
    margin: "0 0 16px",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(254, 226, 226, 0.88)",
    border: "1px solid rgba(248, 113, 113, 0.24)"
  },
  success: {
    color: "#166534",
    margin: "0 0 16px",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(220, 252, 231, 0.92)",
    border: "1px solid rgba(74, 222, 128, 0.2)"
  },
  apiHint: {
    margin: 0,
    color: "var(--admin-text-dim)",
    fontSize: 12
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "end",
    flexWrap: "wrap",
    marginBottom: 24,
    padding: 24,
    borderRadius: 28,
    background: "linear-gradient(180deg, rgba(255,253,250,0.95), rgba(254,242,242,0.9))",
    border: "1px solid var(--admin-border)",
    boxShadow: "var(--admin-shadow)"
  },
  headerLead: {
    display: "grid",
    gap: 6,
    minWidth: 0
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 24
  },
  statCard: {
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,0.86)",
    border: "1px solid var(--admin-border)",
    boxShadow: "var(--admin-shadow)"
  },
  statLabel: {
    display: "block",
    color: "var(--admin-text-muted)",
    marginBottom: 8,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700
  },
  statValue: {
    fontFamily: displayFont,
    fontSize: 34,
    lineHeight: 0.95,
    letterSpacing: "0.03em",
    color: "var(--admin-primary-strong)",
    fontWeight: 400
  },
  layoutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 20
  },
  column: {
    display: "grid",
    gap: 20,
    alignContent: "start"
  },
  panel: {
    display: "grid",
    gap: 16,
    padding: 22,
    borderRadius: 24,
    background: "var(--admin-panel)",
    border: "1px solid var(--admin-border)",
    boxShadow: "var(--admin-shadow)"
  },
  panelTitle: {
    margin: 0,
    fontFamily: displayFont,
    fontSize: 28,
    lineHeight: 0.94,
    letterSpacing: "0.03em",
    color: "var(--admin-primary-strong)",
    textTransform: "uppercase",
    fontWeight: 400
  },
  listStack: {
    display: "grid",
    gap: 12
  },
  listCard: {
    padding: "16px 18px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.88)",
    border: "1px solid var(--admin-border)"
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 12
  },
  inlineActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },
  chipRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12
  },
  chipButton: {
    borderRadius: 999,
    border: "1px solid var(--admin-border-strong)",
    background: "rgba(255,255,255,0.86)",
    color: "var(--admin-primary-strong)",
    padding: "8px 12px",
    fontWeight: 700
  },
  productImagePreview: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: 18,
    marginTop: 10,
    border: "1px solid var(--admin-border)"
  },
  optionList: {
    display: "grid",
    gap: 12
  },
  optionCard: {
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.78)",
    border: "1px solid var(--admin-border)",
    display: "grid",
    gap: 12
  }
};
