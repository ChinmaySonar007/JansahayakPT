"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser } from "./types";

type AuthContextType = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jansahayak_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load auth from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function login(newUser: AuthUser) {
    setUser(newUser);
    try {
      localStorage.setItem("jansahayak_user", JSON.stringify(newUser));
    } catch (e) {
      console.error("Failed to save auth to storage", e);
    }
  }

  function logout() {
    setUser(null);
    try {
      localStorage.removeItem("jansahayak_user");
    } catch (e) {
      console.error("Failed to clear auth from storage", e);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
