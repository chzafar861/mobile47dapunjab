import { getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";

async function apiCall(method: string, path: string, data?: any) {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const res = await fetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const firebaseApi = {
  addBooking: (data: any) => apiCall("POST", "/api/bookings", data),
  getBookings: () => apiCall("GET", "/api/bookings"),
  deleteBooking: (id: string) => apiCall("DELETE", `/api/bookings/${id}`),

  addToCart: (data: any) => apiCall("POST", "/api/cart", data),
  getCart: () => apiCall("GET", "/api/cart"),
  deleteCartItem: (id: string) => apiCall("DELETE", `/api/cart/${id}`),

  addRentalInquiry: (data: any) => apiCall("POST", "/api/rental-inquiries", data),

  addPropertyDetail: (data: any) => apiCall("POST", "/api/property-details", data),
  getPropertyDetails: () => apiCall("GET", "/api/property-details"),
  deletePropertyDetail: (id: string) => apiCall("DELETE", `/api/property-details/${id}`),

  getProfile: () => apiCall("GET", "/api/profile"),
  saveProfile: (data: any) => apiCall("PUT", "/api/profile", data),

  clearAll: () => apiCall("POST", "/api/clear-all"),
};
