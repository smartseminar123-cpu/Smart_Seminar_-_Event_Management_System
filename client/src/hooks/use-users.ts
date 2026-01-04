import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertUser } from "@shared/routes";

export function useUsers(collegeId: number) {
  return useQuery({
    queryKey: [api.superadmin.users.list.path, collegeId],
    enabled: !!collegeId,
    queryFn: async () => {
      const url = buildUrl(api.superadmin.users.list.path, { collegeId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.superadmin.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.superadmin.users.create.path, {
        method: api.superadmin.users.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create user");
      }
      return api.superadmin.users.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.superadmin.users.list.path, variables.collegeId] 
      });
    },
  });
}

export function useSuperAdminStats(collegeId: number) {
  return useQuery({
    queryKey: [api.superadmin.stats.path, collegeId],
    enabled: !!collegeId,
    queryFn: async () => {
      const url = buildUrl(api.superadmin.stats.path, { collegeId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.superadmin.stats.responses[200].parse(await res.json());
    },
  });
}
