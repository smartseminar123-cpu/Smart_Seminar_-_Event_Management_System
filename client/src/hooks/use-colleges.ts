import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertCollege } from "@shared/routes";

export function useColleges() {
  return useQuery({
    queryKey: [api.colleges.list.path],
    queryFn: async () => {
      const res = await fetch(api.colleges.list.path);
      if (!res.ok) throw new Error("Failed to fetch colleges");
      return api.colleges.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCollege() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCollege) => {
      const res = await fetch(api.colleges.create.path, {
        method: api.colleges.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create college");
      }
      
      return api.colleges.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.colleges.list.path] });
    },
  });
}
