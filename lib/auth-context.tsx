import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Platform } from "react-native";
import { getApiUrl } from "./query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const isNative = Platform.OS !== "web";
const TOKEN_KEY = "47da_auth_token";

let memoryToken: string | null = null;

async function getStoredToken(): Promise<string | null> {
  if (!isNative) return null;
  if (memoryToken) return memoryToken;
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    memoryToken = token;
    return token;
  } catch {
    return null;
  }
}

async function storeToken(token: string): Promise<void> {
  if (!isNative) return;
  memoryToken = token;
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

async function clearToken(): Promise<void> {
  if (!isNative) return;
  memoryToken = null;
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function authFetch(path: string, options: RequestInit = {}) {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (isNative) {
    const token = await getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const res = await globalThis.fetch(url.toString(), {
      ...options,
      headers,
      credentials: isNative ? "omit" : "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server returned an invalid response. Please try again.");
    }
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  } catch (e: any) {
    clearTimeout(timeoutId);
    throw e;
  }
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
    if (data.token) {
      await storeToken(data.token);
    }
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const data = await authFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, phone }),
    });
    if (data.token) {
      await storeToken(data.token);
    }
    setUser(data.user);
  };

  const socialLogin = async (socialData: { email: string; name: string; provider: string; providerId?: string; avatarUrl?: string }) => {
    const data = await authFetch("/api/auth/social", {
      method: "POST",
      body: JSON.stringify(socialData),
    });
    if (data.token) {
      await storeToken(data.token);
    }
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    await clearToken();
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
