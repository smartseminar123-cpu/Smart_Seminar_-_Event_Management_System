import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { localDB } from "@/lib/local-db";
export const useAuthStore = create()(persist((set) => ({
    user: null,
    college: null,
    token: null,
    setAuth: (user, college) => set({ user, college }),
    logout: () => set({ user: null, college: null }),
}), {
    name: "ssems-auth",
}));
export function useLogin() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const [, setLocation] = useLocation();
    return useMutation({
        mutationFn: async (credentials) => {
            // Use LocalDB instead of API fetch
            return await localDB.login(credentials);
        },
        onSuccess: (data) => {
            setAuth(data.user, data.college);
            setLocation(data.redirectUrl);
        },
        onError: (error) => {
            console.error("Login failed:", error);
        }
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
