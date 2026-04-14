import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export const lightTheme = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceActive: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#64748b',
  primary: '#4f46e5',
  border: '#e2e8f0',
  error: '#ef4444',
  success: '#10b981',
};

export const darkTheme = {
  background: '#0a0a1a',
  surface: 'rgba(255,255,255,0.04)',
  surfaceActive: 'rgba(255,255,255,0.08)',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  primary: '#6366f1',
  border: 'rgba(255,255,255,0.08)',
  error: '#ef4444',
  success: '#10b981',
};

export type ThemeType = typeof lightTheme;

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('theme').then((savedTheme) => {
      if (savedTheme === 'light') setIsDark(false);
      else if (savedTheme === 'dark') setIsDark(true);
      else setIsDark(systemColorScheme === 'dark');
    });
  }, [systemColorScheme]);

  const toggleTheme = () => {
     setIsDark(prev => {
        const next = !prev;
        AsyncStorage.setItem('theme', next ? 'dark' : 'light');
        return next;
     });
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
