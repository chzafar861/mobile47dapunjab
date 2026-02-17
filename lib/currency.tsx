import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

export type CurrencyCode = "USD" | "PKR" | "INR" | "GBP" | "EUR" | "CAD" | "AED" | "SAR" | "AUD";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nativeName: string;
  flag: string;
  rate: number;
}

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  PKR: 278.5,
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  AED: 3.67,
  SAR: 3.75,
  AUD: 1.53,
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar", nativeName: "US Dollar", flag: "US", rate: DEFAULT_RATES.USD },
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", nativeName: "پاکستانی روپیہ", flag: "PK", rate: DEFAULT_RATES.PKR },
  { code: "INR", symbol: "₹", name: "Indian Rupee", nativeName: "भारतीय रुपया", flag: "IN", rate: DEFAULT_RATES.INR },
  { code: "GBP", symbol: "£", name: "British Pound", nativeName: "British Pound", flag: "GB", rate: DEFAULT_RATES.GBP },
  { code: "EUR", symbol: "€", name: "Euro", nativeName: "Euro", flag: "EU", rate: DEFAULT_RATES.EUR },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", nativeName: "Canadian Dollar", flag: "CA", rate: DEFAULT_RATES.CAD },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", nativeName: "درهم إماراتي", flag: "AE", rate: DEFAULT_RATES.AED },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", nativeName: "ريال سعودي", flag: "SA", rate: DEFAULT_RATES.SAR },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", nativeName: "Australian Dollar", flag: "AU", rate: DEFAULT_RATES.AUD },
];

export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  pakistan: "PKR",
  india: "INR",
  uk: "GBP",
  "united kingdom": "GBP",
  england: "GBP",
  scotland: "GBP",
  wales: "GBP",
  usa: "USD",
  "united states": "USD",
  america: "USD",
  "united states of america": "USD",
  canada: "CAD",
  uae: "AED",
  "united arab emirates": "AED",
  dubai: "AED",
  "saudi arabia": "SAR",
  australia: "AUD",
  germany: "EUR",
  france: "EUR",
  italy: "EUR",
  spain: "EUR",
  netherlands: "EUR",
  belgium: "EUR",
  ireland: "EUR",
  portugal: "EUR",
  austria: "EUR",
  greece: "EUR",
  finland: "EUR",
};

export function getCurrencyForCountry(country: string): CurrencyCode | null {
  if (!country) return null;
  const normalized = country.trim().toLowerCase();
  return COUNTRY_CURRENCY_MAP[normalized] || null;
}

interface CurrencyContextValue {
  currency: CurrencyCode;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  setCurrencyFromCountry: (country: string) => void;
  formatPrice: (usdAmount: number) => string;
  convertPrice: (usdAmount: number) => number;
  rates: Record<CurrencyCode, number>;
  ratesLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "@47dapunjab_currency";
const RATES_CACHE_KEY = "@47dapunjab_rates";
const RATES_TTL = 6 * 60 * 60 * 1000;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && CURRENCIES.find((c) => c.code === saved)) {
        setCurrencyState(saved as CurrencyCode);
      }
    }).catch(() => {});

    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const cached = await AsyncStorage.getItem(RATES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < RATES_TTL) {
          setRates(parsed.rates);
          return;
        }
      }
    } catch {}

    fetchLiveRates();
  };

  const fetchLiveRates = async () => {
    setRatesLoading(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/exchange-rates", baseUrl);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          setRates(data.rates);
          AsyncStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
            rates: data.rates,
            timestamp: Date.now(),
          })).catch(() => {});
        }
      }
    } catch {} finally {
      setRatesLoading(false);
    }
  };

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const setCurrencyFromCountry = useCallback((country: string) => {
    const code = getCurrencyForCountry(country);
    if (code) {
      setCurrency(code);
    }
  }, [setCurrency]);

  const currencyInfo = useMemo(() => {
    const base = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
    return { ...base, rate: rates[currency] || base.rate };
  }, [currency, rates]);

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
    setCurrencyFromCountry,
    formatPrice,
    convertPrice,
    rates,
    ratesLoading,
  }), [currency, currencyInfo, setCurrency, setCurrencyFromCountry, formatPrice, convertPrice, rates, ratesLoading]);

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
