import { signUpAction } from "@/lib/actions/auth.action";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useSignup = () => {
    const router = useRouter();

    const mutate = useMutation({
        mutationFn: signUpAction,
        onSuccess: () => {
            toast.success("Account signed up successfully")
            router.refresh();
        },
        onError: () => {
            toast.error("Something went wrong")
        }
    });

    return mutate;
}