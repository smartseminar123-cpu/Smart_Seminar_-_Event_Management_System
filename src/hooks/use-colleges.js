import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { localDB } from "@/lib/local-db";
export function useColleges() {
    return useQuery({
        queryKey: ["colleges"],
        queryFn: async () => {
            return await localDB.getColleges();
        },
    });
}
export function useCreateCollege() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            return await localDB.createCollege(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["colleges"] });
        },
    });
}
