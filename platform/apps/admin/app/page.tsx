"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  API_BASE_URL,
  apiFetch,
  logoutAdminSession,
  restoreAdminSession,
  saveAdminSession,
  withAdminSession,
  type AdminSession
} from "../lib/api";

type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  category?: { id: string; name: string } | null;
  variants: Array<{ id: string; name: string; priceAmount: number | string }>;
  modifierGroups?: Array<{
    modifierGroup: {
      id: string;
      name: string;
      options: Array<{ id: string; name: string }>;
    };
  }>;
};

type ModifierGroup = {
  id: string;
  name: string;
  description?: string | null;
  options: Array<{ id: string; name: string; priceDeltaAmount: number | string }>;
  products: Array<{ product: { id: string; slug: string; name: string } }>;
};

type DashboardState = {
  categories: Category[];
  products: Product[];
  modifierGroups: ModifierGroup[];
};

const INITIAL_STATE: DashboardState = {
  categories: [],
  products: [],
  modifierGroups: []
};

export default function AdminHomePage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dashboard, setDashboard] = useState<DashboardState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    locationCode: "main",
    slug: "",
    name: "",
    description: ""
  });
  const [productForm, setProductForm] = useState({
    locationCode: "main",
    categorySlug: "",
    slug: "",
    name: "",
    shortDescription: "",
    variantName: "Default",
    priceAmount: "0.00"
  });
  const [groupForm, setGroupForm] = useState({
    locationCode: "main",
    name: "",
    description: "",
    minSelect: "0",
    maxSelect: "1",
    sortOrder: "0",
    isRequired: false
  });
  const [optionForm, setOptionForm] = useState({
    modifierGroupId: "",
    name: "",
    description: "",
    priceDeltaAmount: "0.00"
  });
  const [attachForm, setAttachForm] = useState({
    locationCode: "main",
    productSlug: "",
    modifierGroupId: ""
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      try {
        const existingSession = await restoreAdminSession();
        if (existingSession) {
          setSession(existingSession);
        }
      } catch (restoreError) {
        setError(
          restoreError instanceof Error
            ? restoreError.message
            : "Failed to restore admin session."
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

    void loadDashboardWithSession(session);
  }, [session]);

  async function loadDashboard(token: string) {
    try {
      setError(null);
      const [categories, products, modifierGroups] = await Promise.all([
        apiFetch<Category[]>("/catalog/categories?locationCode=main", undefined, token),
        apiFetch<Product[]>("/catalog/products?locationCode=main", undefined, token),
        apiFetch<ModifierGroup[]>("/modifiers/groups?locationCode=main", undefined, token)
      ]);

      setDashboard({
        categories,
        products,
        modifierGroups
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load admin data.");
    }
  }

  async function loadDashboardWithSession(activeSession: AdminSession) {
    return withAdminSession(
      activeSession,
      async accessToken => {
        await loadDashboard(accessToken);
      },
      setSession
    );
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await apiFetch<AdminSession>("/auth/staff/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password
          })
        });

        saveAdminSession(response);
        setSession(response);
        setPassword("");
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : "Login failed.");
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logoutAdminSession(session);
      setSession(null);
      setDashboard(INITIAL_STATE);
      setError(null);
      setSuccess(null);
    });
  }

  async function withRefresh(action: () => Promise<void>, successMessage: string) {
    if (!session) {
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        setSuccess(null);
        await action();
        await loadDashboard(session.accessToken);
        setSuccess(successMessage);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Action failed.");
      }
    });
  }

  if (isBootstrapping) {
    return (
      <main style={styles.shell}>
        <section style={styles.authCard}>
          <p style={styles.eyebrow}>Tuckinn Commerce Admin</p>
          <h1 style={styles.heroTitle}>Restoring session</h1>
          <p style={styles.mutedText}>Checking admin credentials against the API.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main style={styles.shell}>
        <section style={styles.authCard}>
          <p style={styles.eyebrow}>Tuckinn Commerce Admin</p>
          <h1 style={styles.heroTitle}>Admin Portal</h1>
          <p style={styles.mutedText}>
            Sign in to manage categories, products, modifier groups, and merchandising
            structure.
          </p>
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>
              Staff email
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
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
                required
              />
            </label>
            {error ? <p style={styles.error}>{error}</p> : null}
            <button style={styles.primaryButton} type="submit" disabled={isPending}>
              {isPending ? "Signing in..." : "Open Admin Portal"}
            </button>
            <p style={styles.apiHint}>API target: {API_BASE_URL}</p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.shell}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Catalog + Modifiers</p>
          <h1 style={styles.heroTitle}>Commerce Control Panel</h1>
          <p style={styles.mutedText}>
            Signed in as {session.user.firstName} {session.user.lastName}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => void loadDashboardWithSession(session)}
          >
            Refresh
          </button>
          <button style={styles.secondaryButton} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </section>

      {error ? <p style={styles.error}>{error}</p> : null}
      {success ? <p style={styles.success}>{success}</p> : null}

      <section style={styles.statsGrid}>
        <StatCard label="Categories" value={String(dashboard.categories.length)} />
        <StatCard label="Products" value={String(dashboard.products.length)} />
        <StatCard label="Modifier groups" value={String(dashboard.modifierGroups.length)} />
      </section>

      <section style={styles.layoutGrid}>
        <div style={styles.column}>
          <Panel title="Create Category">
            <form
              style={styles.form}
              onSubmit={event => {
                event.preventDefault();
                void withRefresh(async () => {
                  await withAdminSession(
                    session,
                    accessToken =>
                      apiFetch(
                        "/catalog/categories",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            ...categoryForm,
                            slug: categoryForm.slug.trim(),
                            name: categoryForm.name.trim(),
                            description: categoryForm.description || undefined
                          })
                        },
                        accessToken
                      ),
                    setSession
                  );
                  setCategoryForm({
                    locationCode: "main",
                    slug: "",
                    name: "",
                    description: ""
                  });
                }, "Category saved.");
              }}
            >
              <TextInput label="Slug" value={categoryForm.slug} onChange={value => setCategoryForm(current => ({ ...current, slug: value }))} />
              <TextInput label="Name" value={categoryForm.name} onChange={value => setCategoryForm(current => ({ ...current, name: value }))} />
              <TextArea label="Description" value={categoryForm.description} onChange={value => setCategoryForm(current => ({ ...current, description: value }))} />
              <button style={styles.primaryButton} type="submit" disabled={isPending}>
                Save Category
              </button>
            </form>
          </Panel>

          <Panel title="Create Product">
            <form
              style={styles.form}
              onSubmit={event => {
                event.preventDefault();
                void withRefresh(async () => {
                  await withAdminSession(
                    session,
                    accessToken =>
                      apiFetch(
                        "/catalog/products",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            ...productForm,
                            priceAmount: Number(productForm.priceAmount)
                          })
                        },
                        accessToken
                      ),
                    setSession
                  );
                  setProductForm(current => ({
                    ...current,
                    slug: "",
                    name: "",
                    shortDescription: "",
                    priceAmount: "0.00"
                  }));
                }, "Product saved.");
              }}
            >
              <SelectInput
                label="Category"
                value={productForm.categorySlug}
                onChange={value => setProductForm(current => ({ ...current, categorySlug: value }))}
                options={[
                  { value: "", label: "Select a category" },
                  ...dashboard.categories.map(category => ({
                    value: category.slug,
                    label: category.name
                  }))
                ]}
              />
              <TextInput label="Slug" value={productForm.slug} onChange={value => setProductForm(current => ({ ...current, slug: value }))} />
              <TextInput label="Name" value={productForm.name} onChange={value => setProductForm(current => ({ ...current, name: value }))} />
              <TextArea label="Short Description" value={productForm.shortDescription} onChange={value => setProductForm(current => ({ ...current, shortDescription: value }))} />
              <TextInput label="Variant Name" value={productForm.variantName} onChange={value => setProductForm(current => ({ ...current, variantName: value }))} />
              <TextInput label="Price Amount" value={productForm.priceAmount} onChange={value => setProductForm(current => ({ ...current, priceAmount: value }))} />
              <button style={styles.primaryButton} type="submit" disabled={isPending}>
                Save Product
              </button>
            </form>
          </Panel>

          <Panel title="Catalog Snapshot">
            <div style={styles.listStack}>
              {dashboard.products.map(product => (
                <div key={product.id} style={styles.listCard}>
                  <strong>{product.name}</strong>
                  <p style={styles.mutedText}>{product.category?.name || "Uncategorised"} - {product.slug}</p>
                  <p style={styles.mutedText}>
                    {product.variants
                      .map(variant => `${variant.name} ${formatCurrency(variant.priceAmount)}`)
                      .join(" - ")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={styles.column}>
          <Panel title="Create Modifier Group">
            <form
              style={styles.form}
              onSubmit={event => {
                event.preventDefault();
                void withRefresh(async () => {
                  await withAdminSession(
                    session,
                    accessToken =>
                      apiFetch(
                        "/modifiers/groups",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            ...groupForm,
                            minSelect: Number(groupForm.minSelect),
                            maxSelect: Number(groupForm.maxSelect),
                            sortOrder: Number(groupForm.sortOrder)
                          })
                        },
                        accessToken
                      ),
                    setSession
                  );
                  setGroupForm({
                    locationCode: "main",
                    name: "",
                    description: "",
                    minSelect: "0",
                    maxSelect: "1",
                    sortOrder: "0",
                    isRequired: false
                  });
                }, "Modifier group saved.");
              }}
            >
              <TextInput label="Name" value={groupForm.name} onChange={value => setGroupForm(current => ({ ...current, name: value }))} />
              <TextArea label="Description" value={groupForm.description} onChange={value => setGroupForm(current => ({ ...current, description: value }))} />
              <TextInput label="Min Select" value={groupForm.minSelect} onChange={value => setGroupForm(current => ({ ...current, minSelect: value }))} />
              <TextInput label="Max Select" value={groupForm.maxSelect} onChange={value => setGroupForm(current => ({ ...current, maxSelect: value }))} />
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={groupForm.isRequired}
                  onChange={event =>
                    setGroupForm(current => ({ ...current, isRequired: event.target.checked }))
                  }
                />
                Required group
              </label>
              <button style={styles.primaryButton} type="submit" disabled={isPending}>
                Save Group
              </button>
            </form>
          </Panel>

          <Panel title="Create Modifier Option">
            <form
              style={styles.form}
              onSubmit={event => {
                event.preventDefault();
                void withRefresh(async () => {
                  await withAdminSession(
                    session,
                    accessToken =>
                      apiFetch(
                        "/modifiers/options",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            ...optionForm,
                            priceDeltaAmount: Number(optionForm.priceDeltaAmount)
                          })
                        },
                        accessToken
                      ),
                    setSession
                  );
                  setOptionForm({
                    modifierGroupId: optionForm.modifierGroupId,
                    name: "",
                    description: "",
                    priceDeltaAmount: "0.00"
                  });
                }, "Modifier option saved.");
              }}
            >
              <SelectInput
                label="Modifier Group"
                value={optionForm.modifierGroupId}
                onChange={value => setOptionForm(current => ({ ...current, modifierGroupId: value }))}
                options={[
                  { value: "", label: "Select a group" },
                  ...dashboard.modifierGroups.map(group => ({
                    value: group.id,
                    label: group.name
                  }))
                ]}
              />
              <TextInput label="Option Name" value={optionForm.name} onChange={value => setOptionForm(current => ({ ...current, name: value }))} />
              <TextArea label="Description" value={optionForm.description} onChange={value => setOptionForm(current => ({ ...current, description: value }))} />
              <TextInput label="Price Delta" value={optionForm.priceDeltaAmount} onChange={value => setOptionForm(current => ({ ...current, priceDeltaAmount: value }))} />
              <button style={styles.primaryButton} type="submit" disabled={isPending}>
                Save Option
              </button>
            </form>
          </Panel>

          <Panel title="Attach Group To Product">
            <form
              style={styles.form}
              onSubmit={event => {
                event.preventDefault();
                void withRefresh(async () => {
                  await withAdminSession(
                    session,
                    accessToken =>
                      apiFetch(
                        "/modifiers/attach",
                        {
                          method: "POST",
                          body: JSON.stringify(attachForm)
                        },
                        accessToken
                      ),
                    setSession
                  );
                }, "Modifier group attached.");
              }}
            >
              <SelectInput
                label="Product"
                value={attachForm.productSlug}
                onChange={value => setAttachForm(current => ({ ...current, productSlug: value }))}
                options={[
                  { value: "", label: "Select a product" },
                  ...dashboard.products.map(product => ({
                    value: product.slug,
                    label: product.name
                  }))
                ]}
              />
              <SelectInput
                label="Modifier Group"
                value={attachForm.modifierGroupId}
                onChange={value => setAttachForm(current => ({ ...current, modifierGroupId: value }))}
                options={[
                  { value: "", label: "Select a modifier group" },
                  ...dashboard.modifierGroups.map(group => ({
                    value: group.id,
                    label: group.name
                  }))
                ]}
              />
              <button style={styles.primaryButton} type="submit" disabled={isPending}>
                Attach Group
              </button>
            </form>
          </Panel>

          <Panel title="Modifier Snapshot">
            <div style={styles.listStack}>
              {dashboard.modifierGroups.map(group => (
                <div key={group.id} style={styles.listCard}>
                  <strong>{group.name}</strong>
                  <p style={styles.mutedText}>
                    {group.options
                      .map(option => `${option.name} ${formatCurrency(option.priceDeltaAmount)}`)
                      .join(" - ")}
                  </p>
                  <p style={styles.mutedText}>
                    Applied to:{" "}
                    {group.products.length
                      ? group.products.map(entry => entry.product.name).join(", ")
                      : "No products yet"}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function Panel({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

function TextInput({
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
      <input style={styles.input} value={value} onChange={event => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
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

function SelectInput({
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

function formatCurrency(value: number | string) {
  const amount = Number(value ?? 0);
  return `EUR ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    maxWidth: 1480,
    margin: "0 auto",
    padding: "32px 24px 72px"
  },
  authCard: {
    maxWidth: 560,
    margin: "10vh auto 0",
    padding: 32,
    borderRadius: 28,
    background: "linear-gradient(180deg, rgba(27,18,18,0.98), rgba(16,11,11,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 28px 70px rgba(0,0,0,0.34)"
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
    fontSize: "clamp(2.2rem, 4vw, 3.8rem)",
    lineHeight: 1.02
  },
  mutedText: {
    margin: 0,
    color: "#b4a59f",
    lineHeight: 1.55
  },
  form: {
    display: "grid",
    gap: 16
  },
  label: {
    display: "grid",
    gap: 8,
    fontSize: 14,
    color: "#e7d7cf"
  },
  checkboxLabel: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    color: "#e7d7cf"
  },
  input: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#f6eee6",
    padding: "14px 16px"
  },
  textarea: {
    minHeight: 90,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#f6eee6",
    padding: "14px 16px",
    resize: "vertical"
  },
  select: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#1d1414",
    color: "#f6eee6",
    padding: "14px 16px"
  },
  primaryButton: {
    border: 0,
    borderRadius: 16,
    background: "linear-gradient(135deg, #c63b2d, #e34c3b)",
    color: "white",
    padding: "14px 16px",
    fontWeight: 700
  },
  secondaryButton: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f6eee6",
    padding: "12px 15px"
  },
  error: {
    color: "#ff9d93",
    margin: "0 0 16px"
  },
  success: {
    color: "#89e3b0",
    margin: "0 0 16px"
  },
  apiHint: {
    margin: 0,
    color: "#8d7d77",
    fontSize: 12
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "end",
    flexWrap: "wrap",
    marginBottom: 24
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
    borderRadius: 20,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  statLabel: {
    display: "block",
    color: "#b4a59f",
    marginBottom: 8
  },
  statValue: {
    fontSize: 28
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
    background: "linear-gradient(180deg, rgba(29,20,20,0.98), rgba(15,10,10,0.98))",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  panelTitle: {
    margin: 0,
    fontSize: 22
  },
  listStack: {
    display: "grid",
    gap: 12
  },
  listCard: {
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)"
  }
};
