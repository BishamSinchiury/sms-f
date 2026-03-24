import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import publicApi from '@/services/axios/publicApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      // Use publicApi to maintain correct complete URL / token headers
      const res = await publicApi.post('/auth/refresh/', {}, { withCredentials: true });
      console.log("data", res.data)
      const { access_token, profile_complete, membership_status, role_type } = res.data;

      localStorage.setItem('access_token', access_token);
      publicApi.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      setUser({ profile_complete, membership_status, role_type });
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('access_token');
      delete publicApi.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const signIn = useCallback((access_token, userPayload) => {
    localStorage.setItem('access_token', access_token);
    publicApi.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userPayload);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    try { await publicApi.post('/auth/logout/', {}, { withCredentials: true }); } catch { }
    localStorage.removeItem('access_token');
    delete publicApi.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      initialized: !loading, /* alias for backward compat */
      signIn,
      signOut,
      setUser,
      tryRestoreSession: restoreSession, /* alias for backward compat */
      logout: signOut /* alias for backward compat */
    }}>
      {children}
    </AuthContext.Provider>
  );
};