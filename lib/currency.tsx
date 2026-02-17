import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CurrencyCode = "USD" | "PKR" | "INR" | "GBP" | "EUR" | "CAD" | "AED" | "SAR" | "AUD";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nativeName: string;
  flag: string;
  rate: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar", nativeName: "US Dollar", flag: "US", rate: 1 },
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", nativeName: "پاکستانی روپیہ", flag: "PK", rate: 278.5 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", nativeName: "भारतीय रुपया", flag: "IN", rate: 83.5 },
  { code: "GBP", symbol: "£", name: "British Pound", nativeName: "British Pound", flag: "GB", rate: 0.79 },
  { code: "EUR", symbol: "€", name: "Euro", nativeName: "Euro", flag: "EU", rate: 0.92 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", nativeName: "Canadian Dollar", flag: "CA", rate: 1.36 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", nativeName: "درهم إماراتي", flag: "AE", rate: 3.67 },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", nativeName: "ريال سعودي", flag: "SA", rate: 3.75 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", nativeName: "Australian Dollar", flag: "AU", rate: 1.53 },
];

interface CurrencyContextValue {
  currency: CurrencyCode;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (usdAmount: number) => string;
  convertPrice: (usdAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "@47dapunjab_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && CURRENCIES.find((c) => c.code === saved)) {
        setCurrencyState(saved as CurrencyCode);
      }
    }).catch(() => {});
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const currencyInfo = useMemo(() => {
    return CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  }, [currency]);

  const convertPrice = useCallback((usdAmount: number): number => {
    return usdAmount * currencyInfo.rate;
  }, [currencyInfo]);

  const formatPrice = useCallback((usdAmount: number): string => {
    const converted = usdAmount * currencyInfo.rate;
    if (currencyInfo.rate >= 10) {
      return `${currencyInfo.symbol}${Math.round(converted).toLocaleString()}`;
    }
    return `${currencyInfo.symbol}${converted.toFixed(2)}`;
  }, [currencyInfo]);

  const value = useMemo(() => ({
    currency,
    currencyInfo,
    setCurrency,
    formatPrice,
    convertPrice,
  }), [currency, currencyInfo, setCurrency, formatPrice, convertPrice]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
