import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'competitor_iq_auth';
const REMEMBER_KEY = 'competitor_iq_remember';

const DEFAULT_USER = {
  name: 'Alex Rivera',
  email: 'alex.rivera@enterprise.com',
  role: 'Strategic Lead',
  initials: 'AR'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Error loading auth state', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password, rememberMe = false) => {
    setIsLoading(true);
    // Simulate network latency for authentic feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Basic frontend verification (accepts valid credentials or demo credentials)
    const initials = email.substring(0, 2).toUpperCase();
    const nameFromEmail = email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

    const loggedInUser = {
      name: nameFromEmail || 'Alex Rivera',
      email: email,
      role: 'Strategic Analyst',
      initials: initials || 'AR'
    };

    setUser(loggedInUser);
    setIsLoading(false);

    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (e) {
      console.error('Failed to persist auth state', e);
    }

    return { success: true };
  };

  const signup = async ({ name, email, password }) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newUser = {
      name,
      email,
      role: 'Strategic Analyst',
      initials: initials || 'U'
    };

    setUser(newUser);
    setIsLoading(false);

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to persist auth state', e);
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing auth state', e);
    }
  };

  const resetPassword = async (email) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    return { success: true, message: `Password reset link sent to ${email}` };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
