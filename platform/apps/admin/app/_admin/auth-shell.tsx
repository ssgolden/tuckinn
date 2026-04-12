import Image from "next/image";
import type { FormEventHandler } from "react";
import { TextInput, styles } from "./primitives";

type AdminAuthShellProps = {
  isBootstrapping: boolean;
  email: string;
  password: string;
  error: string | null;
  isPending: boolean;
  apiBaseUrl: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function AdminAuthShell({
  isBootstrapping,
  email,
  password,
  error,
  isPending,
  apiBaseUrl,
  onEmailChange,
  onPasswordChange,
  onSubmit
}: AdminAuthShellProps) {
  if (isBootstrapping) {
    return (
      <main style={styles.shell}>
        <section style={styles.authCard}>
          <div style={styles.authBrand}>
            <div style={styles.brandLogoFrame}>
              <Image src="/logo.jpg" alt="Tuckinn Proper logo" fill sizes="86px" priority />
            </div>
            <div>
              <p style={styles.eyebrow}>Tuckinn Proper Admin</p>
              <h1 style={styles.heroTitle}>Restoring session</h1>
              <p style={styles.mutedText}>Checking admin credentials against the API.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.shell}>
      <section style={styles.authCard}>
        <div style={styles.authBrand}>
          <div style={styles.brandLogoFrame}>
            <Image src="/logo.jpg" alt="Tuckinn Proper logo" fill sizes="86px" priority />
          </div>
          <div>
            <p style={styles.eyebrow}>Tuckinn Proper Admin</p>
            <h1 style={styles.heroTitle}>Operations Portal</h1>
            <p style={styles.mutedText}>
              Sign in to manage categories, products, modifier groups, media, and merchandising
              structure.
            </p>
          </div>
        </div>
        <div style={styles.statusPillRow}>
          <span style={styles.statusPill}>Catalog control</span>
          <span style={styles.statusPill}>Product updates</span>
          <span style={styles.statusPill}>Modifier management</span>
        </div>
        <form onSubmit={onSubmit} style={styles.form}>
          <TextInput
            label="Staff email"
            type="email"
            required
            value={email}
            onChange={onEmailChange}
          />
          <TextInput
            label="Password"
            type="password"
            required
            value={password}
            onChange={onPasswordChange}
          />
          {error ? <p style={styles.error}>{error}</p> : null}
          <button style={styles.primaryButton} type="submit" disabled={isPending}>
            {isPending ? "Signing in..." : "Open Operations Portal"}
          </button>
          <p style={styles.apiHint}>API target: {apiBaseUrl}</p>
        </form>
      </section>
    </main>
  );
}
