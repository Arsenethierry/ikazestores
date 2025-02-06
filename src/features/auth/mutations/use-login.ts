import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logInAction } from "@/lib/actions/auth.action";
import { SignInParams } from "@/lib/types";

export const userKeys = {
    current: ["currentUser"] as const,
    all: ["user"] as const,
    lists: () => [...userKeys.all, "list"] as const,
    list: (filters: string) => [...userKeys.lists(), { filters }] as const,
    details: () => [...userKeys.all, "detail"] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

export const useLogin = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: SignInParams) => logInAction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.current });
            router.refresh();
        },
        onError: () => {
            toast.error("Failed to login")
        }
    });

}