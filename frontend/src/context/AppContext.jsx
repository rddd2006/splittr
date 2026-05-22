import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { authApi } from '../api/client';

const AppContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  toast: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TOAST':
      return { ...state, toast: action.payload };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const res = await authApi.me();
      dispatch({ type: 'SET_USER', payload: res.data });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'SET_USER', payload: null });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    dispatch({ type: 'SET_USER', payload: res.data.user });
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    dispatch({ type: 'SET_USER', payload: res.data.user });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await authApi.logout(refreshToken); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    dispatch({ type: 'SET_TOAST', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3500);
  }, []);

  return (
    <AppContext.Provider value={{ ...state, checkAuth, login, register, logout, showToast }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
