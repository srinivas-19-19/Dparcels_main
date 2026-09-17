import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const { syncLanguage } = useLanguage();
  const { syncTheme } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const newSocket = io('http://localhost:3000', {
        auth: { token: localStorage.getItem('token') },
      });
      setSocket(newSocket);
      return () => newSocket.close();
    } else if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [isLoggedIn]);

  const applyPreferencesFromProfile = (profile) => {
    if (!profile) return;
    if (profile.preferredLanguage && syncLanguage) {
      syncLanguage(profile.preferredLanguage);
    }
    if (profile.theme && syncTheme) {
      syncTheme(profile.theme);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.data;
        setUser(userData);
        setIsLoggedIn(true);
        applyPreferencesFromProfile(userData?.customerProfile);
      } catch (error) {
        console.error('Session expired', error);
        logout();
      }
    }
    setLoading(false);
  };

  const updateUser = (updated) => {
    setUser((prev) => {
      if (!prev) return updated;
      const mergedProfile = updated.customerProfile
        ? updated.customerProfile
        : { ...(prev.customerProfile || {}), ...updated };

      applyPreferencesFromProfile(mergedProfile);

      return {
        ...prev,
        ...updated,
        customerProfile: mergedProfile,
      };
    });
  };

  const login = (userInfo, token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    setUser(userInfo);
    applyPreferencesFromProfile(userInfo?.customerProfile);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        logout,
        setUser,
        updateUser,
        loading,
        socket,
        checkAuth,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
