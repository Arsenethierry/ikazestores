import { getLoggedInUser } from "@/lib/actions/auth.action";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            try {
                const user = await getLoggedInUser()
                return user;
            } catch (error) {
                console.error("Failed to fetch current user:", error);
                return null;
            }
        }
    });
};
