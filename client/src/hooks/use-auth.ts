import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, College } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useLocation } from "wouter";

interface AuthState {
  user: User | null;
  college: College | null;
  token: string | null; // Simulating session token if needed, mainly for local state persistence
  setAuth: (user: User, college: College) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      college: null,
      token: null,
      setAuth: (user, college) => set({ user, college }),
      logout: () => set({ user: null, college: null }),
    }),
    {
      name: "ssems-auth",
    }
  )
);

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (credentials: { collegeId: number; username: string; password: string }) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid credentials");
        throw new Error("Login failed");
      }

      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      setAuth(data.user, data.college);
      setLocation(data.redirectUrl);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
    setLocation("/");
  };
}
