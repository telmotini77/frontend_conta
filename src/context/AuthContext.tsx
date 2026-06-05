import React, { createContext, useState, useContext } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  ruc: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, ruc: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialAuthState = (): { user: User | null; token: string | null } => {
  const token = localStorage.getItem('aura_token');
  const savedUser = localStorage.getItem('aura_user');
  const lastActiveStr = localStorage.getItem('aura_last_active');

  if (!token || !savedUser) {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_last_active');
    return { user: null, token: null };
  }

  if (lastActiveStr) {
    const lastActive = parseInt(lastActiveStr, 10);
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    if (!isNaN(lastActive) && now - lastActive > thirtyMinutes) {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
      localStorage.removeItem('aura_last_active');
      return { user: null, token: null };
    }
  }

  localStorage.setItem('aura_last_active', Date.now().toString());
  try {
    return {
      user: JSON.parse(savedUser) as User,
      token,
    };
  } catch {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_last_active');
    return { user: null, token: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getInitialAuthState().user);
  const [token, setToken] = useState<string | null>(() => getInitialAuthState().token);
  const [loading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://localhost:3000/auth';

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      setUser(data.user);
      setToken(data.accessToken);
      localStorage.setItem('aura_token', data.accessToken);
      localStorage.setItem('aura_user', JSON.stringify(data.user));
      localStorage.setItem('aura_last_active', Date.now().toString());
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      throw err;
    }
  };

  const signup = async (name: string, ruc: string, email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ruc, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      // Automatically login after signup
      await login(email, password);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      throw err;
    }
  };

  const logout = React.useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_last_active');
  }, []);

  // Monitor activity and maintain tab session active
  React.useEffect(() => {
    if (!token) return;

    // Set initial active timestamp
    localStorage.setItem('aura_last_active', Date.now().toString());

    // Update timestamp every 10 seconds while the tab is open
    const interval = setInterval(() => {
      localStorage.setItem('aura_last_active', Date.now().toString());
    }, 10000);

    // Update timestamp on user interactions
    const updateActivity = () => {
      localStorage.setItem('aura_last_active', Date.now().toString());
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [token]);

  // Sync auth state across open tabs
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aura_token') {
        if (!e.newValue) {
          setUser(null);
          setToken(null);
        } else {
          const savedUser = localStorage.getItem('aura_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser) as User);
            } catch {
              setUser(null);
            }
          }
          setToken(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
