import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  city: string;
  country: string;
  purpose: string;
  role: "user" | "admin";
  avatar_url: string | null;
  provider: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  socialLogin: (data: { email: string; name: string; provider: string; providerId?: string; avatarUrl?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name: string; phone: string; city: string; country: string; purpose: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function authFetch(path: string, options: RequestInit = {}) {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await authFetch("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const data = await authFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, phone }),
    });
    setUser(data.user);
  };

  const socialLogin = async (socialData: { email: string; name: string; provider: string; providerId?: string; avatarUrl?: string }) => {
    const data = await authFetch("/api/auth/social", {
      method: "POST",
      body: JSON.stringify(socialData),
    });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
  };

  const updateProfile = async (profileData: { name: string; phone: string; city: string; country: string; purpose: string }) => {
    const data = await authFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    setUser(data.user);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role === "admin",
      login,
      register,
      socialLogin,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
