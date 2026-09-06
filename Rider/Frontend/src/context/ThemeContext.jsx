import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dparcels_theme') || 'Dark';
  });

  useEffect(() => {
    localStorage.setItem('dparcels_theme', theme);
    const isLight = theme === 'Light';
    if (isLight) {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const isLight = theme === 'Light';

  const themeColors = {
    bg: isLight ? '#E2E8F0' : '#060B13',
    frameBg: isLight ? '#FFFFFF' : '#0B131F',
    headerBg: isLight ? '#FFFFFF' : '#0B131F',
    cardBg: isLight ? '#F1F5F9' : '#121D2D',
    cardSecondary: isLight ? '#E2E8F0' : '#1A273B',
    navBg: isLight ? '#FFFFFF' : '#0B131F',
    text: isLight ? '#0F172A' : '#F8FAFC',
    subText: isLight ? '#64748B' : '#94A3B8',
    border: isLight ? '#CBD5E1' : '#1F2E45',
    innerBorder: isLight ? '#E2E8F0' : '#182436',
    modalBg: isLight ? '#FFFFFF' : '#0E1726',
    modalOverlay: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 10, 18, 0.92)',
    accent: '#FF8A00',
    accentGradient: 'linear-gradient(135deg, #FF8A00 0%, #FF5500 100%)',
    accentLight: '#FF9F1C',
    accentDark: '#E85500'
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLight, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
