import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.patch('/customers/me', { theme: nextTheme });
      } catch (err) {
        console.warn('[ThemeContext] Failed to persist theme to backend:', err);
      }
    }
  };

  const syncTheme = (savedTheme) => {
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, syncTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
