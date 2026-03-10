import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "./query-client";

const isNative = Platform.OS !== "web";
const TOKEN_KEY = "47da_auth_token";

export async function nativeFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (isNative) {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {}
  }

  return globalThis.fetch(url.toString(), {
    ...options,
    headers,
    credentials: isNative ? "omit" : "include",
  });
}
