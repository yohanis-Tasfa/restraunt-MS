import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('light');

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      const body = window.document.body;

      // Always clear dark mode
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.classList.add('light');
      body.classList.add('light');
      root.style.colorScheme = 'light';

      localStorage.removeItem('theme');
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = () => {
    // Non-functional as requested
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
