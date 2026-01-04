import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertSeminar } from "@shared/routes";

export function useSeminars(collegeId: number) {
  return useQuery({
    queryKey: [api.seminars.list.path, collegeId],
    enabled: !!collegeId,
    queryFn: async () => {
      const url = buildUrl(api.seminars.list.path, { collegeId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch seminars");
      return api.seminars.list.responses[200].parse(await res.json());
    },
  });
}

export function useSeminar(id: number) {
  return useQuery({
    queryKey: [api.seminars.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.seminars.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch seminar details");
      return api.seminars.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSeminar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSeminar) => {
      const res = await fetch(api.seminars.create.path, {
        method: api.seminars.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error("Failed to create seminar");
      return api.seminars.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.seminars.list.path, variables.collegeId] 
      });
    },
  });
}
