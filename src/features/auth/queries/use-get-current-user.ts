import { useQuery } from "@tanstack/react-query";
import { getLoggedInUser } from "@/lib/actions/auth.action";
import { CurrentUserType } from "@/lib/types";

export const useCurrentUser = (initialData?: CurrentUserType) => {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            try {
                const user = await getLoggedInUser();
                return user;
            } catch (error) {
                console.error("Failed to fetch current user:", error);
                return null;
            }
        },
        initialData,
        staleTime: 60 * 1000,
        retry: 3,
        refetchOnWindowFocus: false,
    });
};