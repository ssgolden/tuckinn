export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export type AdminSession = {
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

export type UploadedMediaAsset = {
  id: string;
  url: string;
  altText?: string | null;
  mimeType: string;
  fileSizeBytes: number;
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

export async function uploadAdminMedia(
  file: File,
  session: AdminSession,
  onSessionRefresh: (nextSession: AdminSession) => void
) {
  const formData = new FormData();
  formData.append("file", file);

  const upload = async (accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`
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

    return response.json() as Promise<UploadedMediaAsset>;
  };

  return withAdminSession(session, upload, onSessionRefresh);
}

export function saveAdminSession(session: AdminSession) {
  localStorage.setItem("tuckinn.admin.session", JSON.stringify(session));
}

export function loadAdminSession(): AdminSession | null {
  const raw = localStorage.getItem("tuckinn.admin.session");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem("tuckinn.admin.session");
}

export async function refreshAdminSession(refreshToken: string) {
  const refreshed = await apiFetch<AdminSession>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refreshToken
    })
  });

  saveAdminSession(refreshed);
  return refreshed;
}

export async function restoreAdminSession() {
  const session = loadAdminSession();
  if (!session) {
    return null;
  }

  try {
    await apiFetch("/auth/me", undefined, session.accessToken);
    return session;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      try {
        return await refreshAdminSession(session.refreshToken);
      } catch {
        clearAdminSession();
        return null;
      }
    }

    throw error;
  }
}

export async function withAdminSession<T>(
  session: AdminSession,
  action: (accessToken: string) => Promise<T>,
  onSessionRefresh: (nextSession: AdminSession) => void
) {
  try {
    return await action(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshAdminSession(session.refreshToken);
      onSessionRefresh(refreshed);
      return action(refreshed.accessToken);
    }

    throw error;
  }
}

export async function logoutAdminSession(session: AdminSession | null) {
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

  clearAdminSession();
}
