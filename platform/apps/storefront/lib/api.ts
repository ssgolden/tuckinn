export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200/api";
export const ADMIN_APP_URL =
  process.env.NEXT_PUBLIC_ADMIN_APP_URL || "http://localhost:3101";
export const STAFF_APP_URL =
  process.env.NEXT_PUBLIC_STAFF_APP_URL || "http://localhost:3102";
export const API_APP_URL = API_BASE_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export type PublicCatalogResponse = {
  location: {
    code: string;
    name: string;
  };
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    products: Array<{
      id: string;
      slug: string;
      name: string;
      shortDescription?: string | null;
      isFeatured: boolean;
      variants: Array<{
        id: string;
        name: string;
        priceAmount: number;
        isDefault: boolean;
      }>;
      modifierGroups: Array<{
        id: string;
        name: string;
        description?: string | null;
        minSelect: number;
        maxSelect: number;
        isRequired: boolean;
        options: Array<{
          id: string;
          name: string;
          description?: string | null;
          priceDeltaAmount: number;
          isDefault: boolean;
        }>;
      }>;
    }>;
  }>;
};

export type DiningTableResponse = {
  id: string;
  tableNumber: number;
  name: string | null;
  qrSlug: string;
  seats: number | null;
  isActive: boolean;
};

export type CartResponse = {
  id: string;
  status: string;
  currencyCode: string;
  totalAmount: number;
  subtotalAmount: number;
  items: Array<{
    id: string;
    quantity: number;
    itemName: string;
    notes?: string | null;
    lineTotalAmount: number;
    modifiers: Array<{
      id: string;
      modifierGroupName: string;
      modifierOptionName: string;
      priceDeltaAmount: number;
    }>;
  }>;
};

export type BackOfficeAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    status?: string;
  };
};

export type BackOfficeSession = BackOfficeAuthResponse & {
  user: BackOfficeAuthResponse["user"] & {
    roles: string[];
    sessionId: string | null;
  };
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = await response.json();
      message = payload.message || payload.error || message;
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function loadStoredCartId() {
  return localStorage.getItem("tuckinn.storefront.cartId");
}

export function saveStoredCartId(cartId: string) {
  localStorage.setItem("tuckinn.storefront.cartId", cartId);
}

export function clearStoredCartId() {
  localStorage.removeItem("tuckinn.storefront.cartId");
}

export function saveBackOfficeSession(session: BackOfficeSession) {
  localStorage.setItem("tuckinn.storefront.backoffice", JSON.stringify(session));
  localStorage.setItem("tuckinn.admin.session", JSON.stringify(session));
  localStorage.setItem("tuckinn.staff.session", JSON.stringify(session));
}

export function loadBackOfficeSession() {
  const raw = localStorage.getItem("tuckinn.storefront.backoffice");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BackOfficeSession;
  } catch {
    return null;
  }
}

export function clearBackOfficeSession() {
  localStorage.removeItem("tuckinn.storefront.backoffice");
  localStorage.removeItem("tuckinn.admin.session");
  localStorage.removeItem("tuckinn.staff.session");
}

export async function loginBackOffice(email: string, password: string) {
  const auth = await apiFetch<BackOfficeAuthResponse>("/auth/staff/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password
    })
  });

  const me = await apiFetch<{ user: { roles: string[]; sessionId: string } }>(
    "/auth/me",
    undefined,
    auth.accessToken
  );

  const session: BackOfficeSession = {
    ...auth,
    user: {
      ...auth.user,
      roles: me.user.roles ?? [],
      sessionId: me.user.sessionId ?? null
    }
  };

  saveBackOfficeSession(session);
  return session;
}

export async function refreshBackOfficeSession(refreshToken: string) {
  const auth = await apiFetch<BackOfficeAuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refreshToken
    })
  });

  const me = await apiFetch<{ user: { roles: string[]; sessionId: string } }>(
    "/auth/me",
    undefined,
    auth.accessToken
  );

  const session: BackOfficeSession = {
    ...auth,
    user: {
      ...auth.user,
      roles: me.user.roles ?? [],
      sessionId: me.user.sessionId ?? null
    }
  };

  saveBackOfficeSession(session);
  return session;
}

export async function restoreBackOfficeSession() {
  const session = loadBackOfficeSession();
  if (!session) {
    return null;
  }

  try {
    const me = await apiFetch<{ user: { roles: string[]; sessionId: string } }>(
      "/auth/me",
      undefined,
      session.accessToken
    );

    const nextSession: BackOfficeSession = {
      ...session,
      user: {
        ...session.user,
        roles: me.user.roles ?? session.user.roles,
        sessionId: me.user.sessionId ?? session.user.sessionId
      }
    };

    saveBackOfficeSession(nextSession);
    return nextSession;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      try {
        return await refreshBackOfficeSession(session.refreshToken);
      } catch {
        clearBackOfficeSession();
        return null;
      }
    }

    throw error;
  }
}

export async function logoutBackOfficeSession(session: BackOfficeSession | null) {
  if (session) {
    try {
      await apiFetch(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({})
        },
        session.accessToken
      );
    } catch {
      // Local session still needs to be cleared if the request fails.
    }
  }

  clearBackOfficeSession();
}
