import { logoutCurrentUser } from "@/lib/actions/auth.action";
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useLogout = () => {
    const router = useRouter();

    const mutate = useMutation({
        mutationFn: async () => logoutCurrentUser,
        onSuccess: () => {
            toast.success("You are logged out");
            router.refresh();
        },
        onError: () => {
            toast.error("Something went wrong")
        }
    });

    return mutate
}