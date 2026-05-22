import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../lib/api';
import type { Usuario } from '../lib/api';

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const user = await authApi.getMe();
      setUsuario(user);
    } catch {
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    await authApi.logout();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
