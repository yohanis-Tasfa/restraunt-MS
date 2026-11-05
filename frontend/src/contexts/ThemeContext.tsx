import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'dark';
  });

  const applyTheme = (currentTheme: Theme) => {
    try {
      const root = window.document.documentElement;
      const body = window.document.body;

      if (currentTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        body.classList.add('dark');
        body.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
        body.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        body.classList.remove('dark');
        body.classList.add('light');
        root.setAttribute('data-theme', 'light');
        body.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }

      localStorage.setItem('theme', currentTheme);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
