import {
  getCurrentUser,
  login,
  loginWithGoogle,
  logout,
  register,
  User,
} from "@/lib/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const u = await login(email, password);
    setUser(u);
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    const u = await loginWithGoogle();
    setUser(u);
  }, []);

  const handleRegister = useCallback(
    async (name: string, email: string, password: string) => {
      const u = await register(name, email, password);
      setUser(u);
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  const handleUpdateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: handleLogin,
        loginWithGoogle: handleGoogleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateUser: handleUpdateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
