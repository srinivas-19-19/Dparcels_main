import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const newSocket = io('http://localhost:3000', {
        auth: { token: localStorage.getItem('token') }
      });
      setSocket(newSocket);
      return () => newSocket.close();
    } else if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [isLoggedIn]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Session expired', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = (userInfo, token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, setUser, loading, socket }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
