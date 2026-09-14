// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { saasService } from '../supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return saasService.getCurrentUser();
  });
  const [currentTenant, setCurrentTenant] = useState(() => {
    const u = saasService.getCurrentUser();
    return u?.tenant || null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.tenant) {
      setCurrentTenant(user.tenant);
    }
  }, [user]);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const res = await saasService.login(email, password);
      setUser(res.user);
      setCurrentTenant(res.user.tenant || null);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    saasService.logout();
    setUser(null);
    setCurrentTenant(null);
  };

  const switchTenant = (tenant) => {
    setCurrentTenant(tenant);
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentTenant,
      role: user?.role || null,
      isSuperAdmin: user?.role === 'superadmin',
      isTenantAdmin: user?.role === 'admin',
      isAttendant: user?.role === 'atendente',
      loading,
      signIn,
      signOut,
      switchTenant
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
