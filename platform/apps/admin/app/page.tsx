"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { AdminAuthShell } from "./_admin/auth-shell";
import {
  CheckboxInput,
  FileInput,
  Panel,
  SelectInput,
  StatCard,
  TextArea,
  TextInput,
  formatCurrency,
  styles
} from "./_admin/primitives";
import {
  INITIAL_STATE,
  type Category,
  type DashboardState,
  type ModifierGroup,
  type Product
} from "./_admin/types";
import {
  API_BASE_URL,
  apiFetch,
  logoutAdminSession,
  restoreAdminSession,
  saveAdminSession,
  uploadAdminMedia,
  withAdminSession,
  type AdminSession
} from "../lib/api";

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
    description: "",
    sortOrder: "0",
    isVisible: true
  });
  const [productForm, setProductForm] = useState({
    locationCode: "main",
    categorySlug: "",
    slug: "",
    name: "",
    shortDescription: "",
    longDescription: "",
    imageUrl: "",
    imageAltText: "",
    isFeatured: false,
    sortOrder: "0",
    sku: "",
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
    priceDeltaAmount: "0.00",
    sortOrder: "0",
    isDefault: false,
    isActive: true
  });
  const [attachForm, setAttachForm] = useState({
    locationCode: "main",
    productSlug: "",
    modifierGroupId: ""
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [categoryEditForm, setCategoryEditForm] = useState({
    slug: "",
    name: "",
    description: "",
    sortOrder: "0",
    isVisible: true
  });
  const [productEditForm, setProductEditForm] = useState({
    categorySlug: "",
    slug: "",
    name: "",
    shortDescription: "",
    longDescription: "",
    imageUrl: "",
    imageAltText: "",
    clearImage: false,
    isFeatured: false,
    status: "active",
    sortOrder: "0",
    sku: "",
    variantName: "Default",
    priceAmount: "0.00"
  });
  const [groupEditForm, setGroupEditForm] = useState({
    name: "",
    description: "",
    minSelect: "0",
    maxSelect: "1",
    sortOrder: "0",
    isRequired: false
  });
  const [optionEditForm, setOptionEditForm] = useState({
    name: "",
    description: "",
    priceDeltaAmount: "0.00",
    sortOrder: "0",
    isDefault: false,
    isActive: true
  });
  const [uploadingImageTarget, setUploadingImageTarget] = useState<"create" | "edit" | null>(null);
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

  function beginCategoryEdit(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryEditForm({
      slug: category.slug,
      name: category.name,
      description: category.description ?? "",
      sortOrder: String(category.sortOrder ?? 0),
      isVisible: category.isVisible ?? true
    });
  }

  function beginProductEdit(product: Product) {
    const defaultVariant = product.variants[0];
    setEditingProductId(product.id);
    setProductEditForm({
      categorySlug:
        dashboard.categories.find(category => category.id === product.category?.id)?.slug ?? "",
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription ?? "",
      longDescription: product.longDescription ?? "",
      imageUrl: product.imageUrl ?? "",
      imageAltText: product.imageAltText ?? "",
      clearImage: false,
      isFeatured: product.isFeatured ?? false,
      status: product.status ?? "active",
      sortOrder: String(product.sortOrder ?? 0),
      sku: defaultVariant?.sku ?? "",
      variantName: defaultVariant?.name ?? "Default",
      priceAmount: String(Number(defaultVariant?.priceAmount ?? 0).toFixed(2))
    });
  }

  function beginGroupEdit(group: ModifierGroup) {
    setEditingGroupId(group.id);
    setGroupEditForm({
      name: group.name,
      description: group.description ?? "",
      minSelect: String(group.minSelect ?? 0),
      maxSelect: String(group.maxSelect ?? 1),
      sortOrder: String(group.sortOrder ?? 0),
      isRequired: group.isRequired ?? false
    });
  }

  function beginOptionEdit(groupId: string, option: ModifierGroup["options"][number]) {
    setOptionEditForm({
      name: option.name,
      description: option.description ?? "",
      priceDeltaAmount: String(Number(option.priceDeltaAmount ?? 0).toFixed(2)),
      sortOrder: String(option.sortOrder ?? 0),
      isDefault: option.isDefault ?? false,
      isActive: option.isActive ?? true
    });
    setOptionForm(current => ({
      ...current,
      modifierGroupId: groupId
    }));
    setEditingOptionId(option.id);
  }

  async function handleCreateImageUpload(file: File) {
    if (!session) {
      return;
    }

    try {
      setUploadingImageTarget("create");
      setError(null);
      const asset = await uploadAdminMedia(file, session, setSession);
      setProductForm(current => ({
        ...current,
        imageUrl: asset.url,
        imageAltText: current.imageAltText || file.name.replace(/\.[^.]+$/, "")
      }));
      setSuccess("Product image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploadingImageTarget(null);
    }
  }

  async function handleEditImageUpload(file: File) {
    if (!session) {
      return;
    }

    try {
      setUploadingImageTarget("edit");
      setError(null);
      const asset = await uploadAdminMedia(file, session, setSession);
      setProductEditForm(current => ({
        ...current,
        imageUrl: asset.url,
        imageAltText: current.imageAltText || file.name.replace(/\.[^.]+$/, ""),
        clearImage: false
      }));
      setSuccess("Product image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploadingImageTarget(null);
    }
  }

  if (isBootstrapping) {
    return (
      <AdminAuthShell
        isBootstrapping
        email={email}
        password={password}
        error={error}
        isPending={isPending}
        apiBaseUrl={API_BASE_URL}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  if (!session) {
    return (
      <AdminAuthShell
        isBootstrapping={false}
        email={email}
        password={password}
        error={error}
        isPending={isPending}
        apiBaseUrl={API_BASE_URL}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main style={styles.shell}>
      <section style={styles.header}>
        <div style={styles.headerBrand}>
          <div style={styles.brandLogoFrame}>
            <Image src="/logo.jpg" alt="Tuckinn Proper logo" fill sizes="86px" priority />
          </div>
          <div style={styles.headerLead}>
            <p style={styles.eyebrow}>Tuckinn Proper Admin</p>
            <h1 style={styles.heroTitle}>Operations Control Panel</h1>
            <p style={styles.mutedText}>
              Signed in as {session.user.firstName} {session.user.lastName}. Manage the live
              catalog, products, media, and modifier structure from one place.
            </p>
            <div style={styles.statusPillRow}>
              <span style={styles.statusPill}>Categories {dashboard.categories.length}</span>
              <span style={styles.statusPill}>Products {dashboard.products.length}</span>
              <span style={styles.statusPill}>
                Modifier groups {dashboard.modifierGroups.length}
              </span>
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => void loadDashboardWithSession(session)}
          >
            Refresh data
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
                            description: categoryForm.description || undefined,
                            sortOrder: Number(categoryForm.sortOrder),
                            isVisible: categoryForm.isVisible
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
                    description: "",
                    sortOrder: "0",
                    isVisible: true
                  });
                }, "Category saved.");
              }}
            >
              <TextInput label="Slug" value={categoryForm.slug} onChange={value => setCategoryForm(current => ({ ...current, slug: value }))} />
              <TextInput label="Name" value={categoryForm.name} onChange={value => setCategoryForm(current => ({ ...current, name: value }))} />
              <TextArea label="Description" value={categoryForm.description} onChange={value => setCategoryForm(current => ({ ...current, description: value }))} />
              <TextInput label="Sort Order" value={categoryForm.sortOrder} onChange={value => setCategoryForm(current => ({ ...current, sortOrder: value }))} />
              <CheckboxInput label="Visible category" checked={categoryForm.isVisible} onChange={checked => setCategoryForm(current => ({ ...current, isVisible: checked }))} />
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
                            slug: productForm.slug.trim(),
                            name: productForm.name.trim(),
                            imageUrl: productForm.imageUrl || undefined,
                            imageAltText: productForm.imageAltText || undefined,
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
                    longDescription: "",
                    imageUrl: "",
                    imageAltText: "",
                    isFeatured: false,
                    sortOrder: "0",
                    sku: "",
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
              <TextArea label="Long Description" value={productForm.longDescription} onChange={value => setProductForm(current => ({ ...current, longDescription: value }))} />
              <TextInput label="Image URL" value={productForm.imageUrl} onChange={value => setProductForm(current => ({ ...current, imageUrl: value }))} />
              <TextInput label="Image Alt Text" value={productForm.imageAltText} onChange={value => setProductForm(current => ({ ...current, imageAltText: value }))} />
              <FileInput
                label={uploadingImageTarget === "create" ? "Uploading image..." : "Upload image from device"}
                onChange={file => void handleCreateImageUpload(file)}
              />
              <TextInput label="Sort Order" value={productForm.sortOrder} onChange={value => setProductForm(current => ({ ...current, sortOrder: value }))} />
              <TextInput label="SKU" value={productForm.sku} onChange={value => setProductForm(current => ({ ...current, sku: value }))} />
              <TextInput label="Variant Name" value={productForm.variantName} onChange={value => setProductForm(current => ({ ...current, variantName: value }))} />
              <TextInput label="Price Amount" value={productForm.priceAmount} onChange={value => setProductForm(current => ({ ...current, priceAmount: value }))} />
              <CheckboxInput label="Featured product" checked={productForm.isFeatured} onChange={checked => setProductForm(current => ({ ...current, isFeatured: checked }))} />
              <button style={styles.primaryButton} type="submit" disabled={isPending}>
                Save Product
              </button>
            </form>
          </Panel>

          <Panel title="Manage Categories">
            <div style={styles.listStack}>
              {dashboard.categories.map(category => (
                <div key={category.id} style={styles.listCard}>
                  <div style={styles.itemHeader}>
                    <div>
                      <strong>{category.name}</strong>
                      <p style={styles.mutedText}>
                        {category.slug} | Sort {category.sortOrder ?? 0} | {category.isVisible ? "Visible" : "Hidden"}
                      </p>
                    </div>
                    <button style={styles.secondaryButton} onClick={() => beginCategoryEdit(category)}>
                      Edit
                    </button>
                  </div>
                  {editingCategoryId === category.id ? (
                    <form
                      style={styles.form}
                      onSubmit={event => {
                        event.preventDefault();
                        void withRefresh(async () => {
                          await withAdminSession(
                            session,
                            accessToken =>
                              apiFetch(
                                `/catalog/categories/${category.id}`,
                                {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    slug: categoryEditForm.slug.trim(),
                                    name: categoryEditForm.name.trim(),
                                    description: categoryEditForm.description || undefined,
                                    sortOrder: Number(categoryEditForm.sortOrder),
                                    isVisible: categoryEditForm.isVisible
                                  })
                                },
                                accessToken
                              ),
                            setSession
                          );
                          setEditingCategoryId(null);
                        }, "Category updated.");
                      }}
                    >
                      <TextInput label="Slug" value={categoryEditForm.slug} onChange={value => setCategoryEditForm(current => ({ ...current, slug: value }))} />
                      <TextInput label="Name" value={categoryEditForm.name} onChange={value => setCategoryEditForm(current => ({ ...current, name: value }))} />
                      <TextArea label="Description" value={categoryEditForm.description} onChange={value => setCategoryEditForm(current => ({ ...current, description: value }))} />
                      <TextInput label="Sort Order" value={categoryEditForm.sortOrder} onChange={value => setCategoryEditForm(current => ({ ...current, sortOrder: value }))} />
                      <CheckboxInput label="Visible category" checked={categoryEditForm.isVisible} onChange={checked => setCategoryEditForm(current => ({ ...current, isVisible: checked }))} />
                      <div style={styles.inlineActions}>
                        <button style={styles.primaryButton} type="submit" disabled={isPending}>
                          Update Category
                        </button>
                        <button style={styles.secondaryButton} type="button" onClick={() => setEditingCategoryId(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Manage Products">
            <div style={styles.listStack}>
              {dashboard.products.map(product => (
                <div key={product.id} style={styles.listCard}>
                  <div style={styles.itemHeader}>
                    <div>
                      <strong>{product.name}</strong>
                      <p style={styles.mutedText}>
                        {product.category?.name || "Uncategorised"} | {product.slug} | {product.status ?? "active"}
                      </p>
                      <p style={styles.mutedText}>
                        {product.variants
                          .map(variant => `${variant.name} ${formatCurrency(variant.priceAmount)}`)
                          .join(" - ")}
                      </p>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.imageAltText || product.name}
                          style={styles.productImagePreview}
                        />
                      ) : null}
                    </div>
                    <div style={styles.inlineActions}>
                      <button style={styles.secondaryButton} onClick={() => beginProductEdit(product)}>
                        Edit
                      </button>
                      {product.status === "archived" ? (
                        <button
                          style={styles.secondaryButton}
                          onClick={() =>
                            void withRefresh(async () => {
                              await withAdminSession(
                                session,
                                accessToken =>
                                  apiFetch(
                                    `/catalog/products/${product.id}/restore`,
                                    { method: "PATCH", body: JSON.stringify({}) },
                                    accessToken
                                  ),
                                setSession
                              );
                            }, "Product restored.")
                          }
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          style={styles.secondaryButton}
                          onClick={() =>
                            void withRefresh(async () => {
                              await withAdminSession(
                                session,
                                accessToken =>
                                  apiFetch(
                                    `/catalog/products/${product.id}/archive`,
                                    { method: "PATCH", body: JSON.stringify({}) },
                                    accessToken
                                  ),
                                setSession
                              );
                            }, "Product archived.")
                          }
                        >
                          Archive
                        </button>
                      )}
                      <button
                        style={styles.dangerButton}
                        onClick={() => {
                          if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) {
                            return;
                          }
                          void withRefresh(async () => {
                            await withAdminSession(
                              session,
                              accessToken =>
                                apiFetch(`/catalog/products/${product.id}`, { method: "DELETE" }, accessToken),
                              setSession
                            );
                          }, "Product deleted.");
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {product.modifierGroups?.length ? (
                    <div style={styles.chipRow}>
                      {product.modifierGroups.map(entry => (
                        <button
                          key={entry.modifierGroup.id}
                          style={styles.chipButton}
                          onClick={() =>
                            void withRefresh(async () => {
                              await withAdminSession(
                                session,
                                accessToken =>
                                  apiFetch(
                                    `/modifiers/products/${product.id}/groups/${entry.modifierGroup.id}`,
                                    { method: "DELETE" },
                                    accessToken
                                  ),
                                setSession
                              );
                            }, `Removed ${entry.modifierGroup.name} from ${product.name}.`)
                          }
                        >
                          Remove {entry.modifierGroup.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {editingProductId === product.id ? (
                    <form
                      style={styles.form}
                      onSubmit={event => {
                        event.preventDefault();
                        void withRefresh(async () => {
                          await withAdminSession(
                            session,
                            accessToken =>
                              apiFetch(
                                `/catalog/products/${product.id}`,
                                {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    categorySlug: productEditForm.categorySlug,
                                    slug: productEditForm.slug.trim(),
                                    name: productEditForm.name.trim(),
                                    shortDescription: productEditForm.shortDescription || undefined,
                                    longDescription: productEditForm.longDescription || undefined,
                                    imageUrl: productEditForm.clearImage
                                      ? undefined
                                      : productEditForm.imageUrl || undefined,
                                    imageAltText: productEditForm.imageAltText || undefined,
                                    clearImage: productEditForm.clearImage,
                                    isFeatured: productEditForm.isFeatured,
                                    status: productEditForm.status,
                                    sortOrder: Number(productEditForm.sortOrder),
                                    sku: productEditForm.sku || undefined,
                                    variantName: productEditForm.variantName,
                                    priceAmount: Number(productEditForm.priceAmount)
                                  })
                                },
                                accessToken
                              ),
                            setSession
                          );
                          setEditingProductId(null);
                        }, "Product updated.");
                      }}
                    >
                      <SelectInput
                        label="Category"
                        value={productEditForm.categorySlug}
                        onChange={value => setProductEditForm(current => ({ ...current, categorySlug: value }))}
                        options={[
                          { value: "", label: "Select a category" },
                          ...dashboard.categories.map(category => ({
                            value: category.slug,
                            label: category.name
                          }))
                        ]}
                      />
                      <TextInput label="Slug" value={productEditForm.slug} onChange={value => setProductEditForm(current => ({ ...current, slug: value }))} />
                      <TextInput label="Name" value={productEditForm.name} onChange={value => setProductEditForm(current => ({ ...current, name: value }))} />
                      <TextArea label="Short Description" value={productEditForm.shortDescription} onChange={value => setProductEditForm(current => ({ ...current, shortDescription: value }))} />
                      <TextArea label="Long Description" value={productEditForm.longDescription} onChange={value => setProductEditForm(current => ({ ...current, longDescription: value }))} />
                      <TextInput label="Image URL" value={productEditForm.imageUrl} onChange={value => setProductEditForm(current => ({ ...current, imageUrl: value, clearImage: false }))} />
                      <TextInput label="Image Alt Text" value={productEditForm.imageAltText} onChange={value => setProductEditForm(current => ({ ...current, imageAltText: value }))} />
                      <FileInput
                        label={uploadingImageTarget === "edit" ? "Uploading image..." : "Upload image from device"}
                        onChange={file => void handleEditImageUpload(file)}
                      />
                      <CheckboxInput label="Clear current image" checked={productEditForm.clearImage} onChange={checked => setProductEditForm(current => ({ ...current, clearImage: checked }))} />
                      <SelectInput
                        label="Status"
                        value={productEditForm.status}
                        onChange={value =>
                          setProductEditForm(current => ({
                            ...current,
                            status: value as "draft" | "active" | "archived"
                          }))
                        }
                        options={[
                          { value: "active", label: "Active" },
                          { value: "draft", label: "Draft" },
                          { value: "archived", label: "Archived" }
                        ]}
                      />
                      <TextInput label="Sort Order" value={productEditForm.sortOrder} onChange={value => setProductEditForm(current => ({ ...current, sortOrder: value }))} />
                      <TextInput label="SKU" value={productEditForm.sku} onChange={value => setProductEditForm(current => ({ ...current, sku: value }))} />
                      <TextInput label="Variant Name" value={productEditForm.variantName} onChange={value => setProductEditForm(current => ({ ...current, variantName: value }))} />
                      <TextInput label="Price Amount" value={productEditForm.priceAmount} onChange={value => setProductEditForm(current => ({ ...current, priceAmount: value }))} />
                      <CheckboxInput label="Featured product" checked={productEditForm.isFeatured} onChange={checked => setProductEditForm(current => ({ ...current, isFeatured: checked }))} />
                      <div style={styles.inlineActions}>
                        <button style={styles.primaryButton} type="submit" disabled={isPending}>
                          Update Product
                        </button>
                        <button style={styles.secondaryButton} type="button" onClick={() => setEditingProductId(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
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
                            priceDeltaAmount: Number(optionForm.priceDeltaAmount),
                            sortOrder: Number(optionForm.sortOrder),
                            isDefault: optionForm.isDefault,
                            isActive: optionForm.isActive
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
                    priceDeltaAmount: "0.00",
                    sortOrder: "0",
                    isDefault: false,
                    isActive: true
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
              <TextInput label="Sort Order" value={optionForm.sortOrder} onChange={value => setOptionForm(current => ({ ...current, sortOrder: value }))} />
              <CheckboxInput label="Default option" checked={optionForm.isDefault} onChange={checked => setOptionForm(current => ({ ...current, isDefault: checked }))} />
              <CheckboxInput label="Active option" checked={optionForm.isActive} onChange={checked => setOptionForm(current => ({ ...current, isActive: checked }))} />
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

          <Panel title="Manage Modifier Groups">
            <div style={styles.listStack}>
              {dashboard.modifierGroups.map(group => (
                <div key={group.id} style={styles.listCard}>
                  <div style={styles.itemHeader}>
                    <div>
                      <strong>{group.name}</strong>
                      <p style={styles.mutedText}>
                        Min {group.minSelect ?? 0} | Max {group.maxSelect ?? 1} | Sort {group.sortOrder ?? 0} | {group.isRequired ? "Required" : "Optional"}
                      </p>
                      <p style={styles.mutedText}>
                        Applied to:{" "}
                        {group.products.length
                          ? group.products.map(entry => entry.product.name).join(", ")
                          : "No products yet"}
                      </p>
                    </div>
                    <button style={styles.secondaryButton} onClick={() => beginGroupEdit(group)}>
                      Edit
                    </button>
                  </div>
                  {editingGroupId === group.id ? (
                    <form
                      style={styles.form}
                      onSubmit={event => {
                        event.preventDefault();
                        void withRefresh(async () => {
                          await withAdminSession(
                            session,
                            accessToken =>
                              apiFetch(
                                `/modifiers/groups/${group.id}`,
                                {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    name: groupEditForm.name.trim(),
                                    description: groupEditForm.description || undefined,
                                    minSelect: Number(groupEditForm.minSelect),
                                    maxSelect: Number(groupEditForm.maxSelect),
                                    sortOrder: Number(groupEditForm.sortOrder),
                                    isRequired: groupEditForm.isRequired
                                  })
                                },
                                accessToken
                              ),
                            setSession
                          );
                          setEditingGroupId(null);
                        }, "Modifier group updated.");
                      }}
                    >
                      <TextInput label="Name" value={groupEditForm.name} onChange={value => setGroupEditForm(current => ({ ...current, name: value }))} />
                      <TextArea label="Description" value={groupEditForm.description} onChange={value => setGroupEditForm(current => ({ ...current, description: value }))} />
                      <TextInput label="Min Select" value={groupEditForm.minSelect} onChange={value => setGroupEditForm(current => ({ ...current, minSelect: value }))} />
                      <TextInput label="Max Select" value={groupEditForm.maxSelect} onChange={value => setGroupEditForm(current => ({ ...current, maxSelect: value }))} />
                      <TextInput label="Sort Order" value={groupEditForm.sortOrder} onChange={value => setGroupEditForm(current => ({ ...current, sortOrder: value }))} />
                      <CheckboxInput label="Required group" checked={groupEditForm.isRequired} onChange={checked => setGroupEditForm(current => ({ ...current, isRequired: checked }))} />
                      <div style={styles.inlineActions}>
                        <button style={styles.primaryButton} type="submit" disabled={isPending}>
                          Update Group
                        </button>
                        <button style={styles.secondaryButton} type="button" onClick={() => setEditingGroupId(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                  <div style={styles.optionList}>
                    {group.options.map(option => (
                      <div key={option.id} style={styles.optionCard}>
                        <div>
                          <strong>{option.name}</strong>
                          <p style={styles.mutedText}>
                            {formatCurrency(option.priceDeltaAmount)} | Sort {option.sortOrder ?? 0} | {option.isActive ? "Active" : "Inactive"}{option.isDefault ? " | Default" : ""}
                          </p>
                        </div>
                        <button style={styles.secondaryButton} onClick={() => beginOptionEdit(group.id, option)}>
                          Edit option
                        </button>
                        {editingOptionId === option.id ? (
                          <form
                            style={styles.form}
                            onSubmit={event => {
                              event.preventDefault();
                              void withRefresh(async () => {
                                await withAdminSession(
                                  session,
                                  accessToken =>
                                    apiFetch(
                                      `/modifiers/options/${option.id}`,
                                      {
                                        method: "PATCH",
                                        body: JSON.stringify({
                                          name: optionEditForm.name.trim(),
                                          description: optionEditForm.description || undefined,
                                          priceDeltaAmount: Number(optionEditForm.priceDeltaAmount),
                                          sortOrder: Number(optionEditForm.sortOrder),
                                          isDefault: optionEditForm.isDefault,
                                          isActive: optionEditForm.isActive
                                        })
                                      },
                                      accessToken
                                    ),
                                  setSession
                                );
                                setEditingOptionId(null);
                              }, "Modifier option updated.");
                            }}
                          >
                            <TextInput label="Option Name" value={optionEditForm.name} onChange={value => setOptionEditForm(current => ({ ...current, name: value }))} />
                            <TextArea label="Description" value={optionEditForm.description} onChange={value => setOptionEditForm(current => ({ ...current, description: value }))} />
                            <TextInput label="Price Delta" value={optionEditForm.priceDeltaAmount} onChange={value => setOptionEditForm(current => ({ ...current, priceDeltaAmount: value }))} />
                            <TextInput label="Sort Order" value={optionEditForm.sortOrder} onChange={value => setOptionEditForm(current => ({ ...current, sortOrder: value }))} />
                            <CheckboxInput label="Default option" checked={optionEditForm.isDefault} onChange={checked => setOptionEditForm(current => ({ ...current, isDefault: checked }))} />
                            <CheckboxInput label="Active option" checked={optionEditForm.isActive} onChange={checked => setOptionEditForm(current => ({ ...current, isActive: checked }))} />
                            <div style={styles.inlineActions}>
                              <button style={styles.primaryButton} type="submit" disabled={isPending}>
                                Update Option
                              </button>
                              <button style={styles.secondaryButton} type="button" onClick={() => setEditingOptionId(null)}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
