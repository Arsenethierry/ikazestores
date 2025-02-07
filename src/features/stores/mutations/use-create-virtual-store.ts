import { createVirtualStoreAction } from "@/lib/actions/vitual-store.action";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useCreateVirtualStore = () => {
    const router = useRouter();

    const mutate = useMutation({
        mutationFn: createVirtualStoreAction,
        onSuccess: () => {
            toast.success("Store created successfully")
            router.push("/admin/stores");
        },
        onError: () => {
            toast.error("Something went wrong")
        }
    });

    return mutate;
}