export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200/api";
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export type StaffLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
};

function normalizeStaffSession(session: StaffLoginResponse): StaffLoginResponse {
  return {
    ...session,
    user: {
      ...session.user,
      roles: Array.isArray(session.user?.roles) ? session.user.roles : []
    }
  };
}

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

export function saveStaffSession(session: StaffLoginResponse) {
  localStorage.setItem("tuckinn.staff.session", JSON.stringify(normalizeStaffSession(session)));
}

export function loadStaffSession(): StaffLoginResponse | null {
  const raw = localStorage.getItem("tuckinn.staff.session");
  if (!raw) {
    return null;
  }

  try {
    return normalizeStaffSession(JSON.parse(raw) as StaffLoginResponse);
  } catch {
    return null;
  }
}

export function clearStaffSession() {
  localStorage.removeItem("tuckinn.staff.session");
}

export async function refreshStaffSession(refreshToken: string) {
  const refreshed = await apiFetch<StaffLoginResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refreshToken
    })
  });

  const normalized = normalizeStaffSession(refreshed);
  saveStaffSession(normalized);
  return normalized;
}

export async function restoreStaffSession() {
  const session = loadStaffSession();
  if (!session) {
    return null;
  }

  try {
    await apiFetch("/auth/me", undefined, session.accessToken);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      try {
        return await refreshStaffSession(session.refreshToken);
      } catch {
        clearStaffSession();
        return null;
      }
    }

    throw error;
  }
}

export async function withStaffSession<T>(
  session: StaffLoginResponse,
  action: (accessToken: string) => Promise<T>,
  onSessionRefresh: (nextSession: StaffLoginResponse) => void
) {
  try {
    return await action(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshStaffSession(session.refreshToken);
      onSessionRefresh(refreshed);
      return action(refreshed.accessToken);
    }

    throw error;
  }
}

export async function logoutStaffSession(session: StaffLoginResponse | null) {
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
      // Local session should still be cleared if the server call fails.
    }
  }

  clearStaffSession();
}
