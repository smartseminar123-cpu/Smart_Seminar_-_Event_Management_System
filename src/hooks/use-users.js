import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { localDB } from "@/lib/local-db";
export function useUsers(collegeId) {
    return useQuery({
        queryKey: ["users", collegeId],
        enabled: !!collegeId,
        queryFn: async () => {
            return await localDB.getUsersByCollege(collegeId);
        },
    });
}
export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            return await localDB.createUser(data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["users", variables.collegeId]
            });
        },
    });
}
export function useSuperAdminStats(collegeId) {
    return useQuery({
        queryKey: ["superadmin-stats", collegeId],
        enabled: !!collegeId,
        queryFn: async () => {
            return await localDB.getCollegeStats(collegeId);
        },
    });
}
