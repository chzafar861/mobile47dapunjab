import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, ThemeColors } from '../types';
import { lightTheme, darkTheme } from '../constants/theme';

const THEME_KEY = '@47daPunjab_theme';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: lightTheme,

  setTheme: async (mode) => {
    const colors = mode === 'dark' ? darkTheme : lightTheme;
    set({ mode, colors });
    await AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  },

  toggleTheme: async () => {
    const { mode } = get();
    const newMode = mode === 'light' ? 'dark' : 'light';
    await get().setTheme(newMode);
  },

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        const colors = stored === 'dark' ? darkTheme : lightTheme;
        set({ mode: stored, colors });
      }
    } catch {
      // Use default light theme
    }
  },
}));
