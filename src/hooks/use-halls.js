import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { localDB } from "@/lib/local-db";

export function useHalls(collegeId) {
    return useQuery({
        queryKey: ["halls", collegeId],
        enabled: !!collegeId,
        queryFn: async () => {
            return await localDB.getHalls(collegeId);
        },
    });
}

export function useCreateHall() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            return await localDB.createHall(data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["halls", variables.collegeId]
            });
        },
    });
}
