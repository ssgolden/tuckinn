"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiFetch, ApiError } from "./api";

export type CustomerSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

const SESSION_KEY = "tuckinn.customer.session";

const CustomerAuthContext = createContext<{
  session: CustomerSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
} | null>(null);

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSession(parsed);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiFetch<CustomerSession>("/auth/customer/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(SESSION_KEY, JSON.stringify(response));
    setSession(response);
  };

  const register = async (data: RegisterData) => {
    const response = await apiFetch<CustomerSession>("/auth/customer/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    localStorage.setItem(SESSION_KEY, JSON.stringify(response));
    setSession(response);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ session, isLoading, login, register, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as CustomerSession;
    return parsed.accessToken;
  } catch {
    return null;
  }
}
