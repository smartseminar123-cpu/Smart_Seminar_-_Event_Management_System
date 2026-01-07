import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { localDB } from "@/lib/local-db";
export function useRegistrations(seminarId) {
    return useQuery({
        queryKey: ["registrations", seminarId],
        enabled: !!seminarId,
        queryFn: async () => {
            return await localDB.getRegistrations(seminarId);
        },
    });
}
export function useCreateRegistration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            return await localDB.createRegistration(data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["registrations", variables.seminarId]
            });
            queryClient.invalidateQueries({
                queryKey: ["seminar", variables.seminarId]
            });
        },
    });
}
export function useVerifyTicket() {
    return useMutation({
        mutationFn: async (uniqueId) => {
            return await localDB.verifyAttendance({ uniqueId });
        },
    });
}
