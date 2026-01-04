import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertRegistration } from "@shared/routes";

export function useRegistrations(seminarId: number) {
  return useQuery({
    queryKey: [api.registrations.list.path, seminarId],
    enabled: !!seminarId,
    queryFn: async () => {
      const url = buildUrl(api.registrations.list.path, { seminarId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch registrations");
      return api.registrations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRegistration) => {
      const res = await fetch(api.registrations.create.path, {
        method: api.registrations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 409) throw new Error("Seat already taken");
        throw new Error("Failed to register");
      }
      return api.registrations.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.registrations.list.path, variables.seminarId] 
      });
      queryClient.invalidateQueries({
        queryKey: [api.seminars.get.path, variables.seminarId]
      });
    },
  });
}

export function useVerifyTicket() {
  return useMutation({
    mutationFn: async (uniqueId: string) => {
      const res = await fetch(api.attendance.verify.path, {
        method: api.attendance.verify.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId }),
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Invalid ticket ID");
        throw new Error("Failed to verify");
      }
      return api.attendance.verify.responses[200].parse(await res.json());
    },
  });
}
