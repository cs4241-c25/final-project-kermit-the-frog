'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const themes = {
  light: 'Light',
  dark: 'Dark',
  kermit: 'Kermit'
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Function to get system theme
  const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  useEffect(() => {
    // Check local storage for saved theme and preference
    const savedTheme = localStorage.getItem('theme');
    const savedIsSystemTheme = localStorage.getItem('isSystemTheme');
    
    if (savedTheme && themes[savedTheme] && savedIsSystemTheme !== 'true') {
      setTheme(savedTheme);
      setIsSystemTheme(false);
    } else {
      // Use system theme if no saved theme or if system theme preference is saved
      setTheme(getSystemTheme());
      setIsSystemTheme(true);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      if (isSystemTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  useEffect(() => {
    // Update data-theme attribute when theme changes
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save theme and preference to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('isSystemTheme', isSystemTheme.toString());
  }, [theme, isSystemTheme]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      setTheme(newTheme);
      // If user selects a theme manually, disable system theme
      if (newTheme !== getSystemTheme()) {
        setIsSystemTheme(false);
      }
    },
    themes,
    isSystemTheme,
    setIsSystemTheme: (value) => {
      setIsSystemTheme(value);
      if (value) {
        // If enabling system theme, immediately apply system preference
        setTheme(getSystemTheme());
      }
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 