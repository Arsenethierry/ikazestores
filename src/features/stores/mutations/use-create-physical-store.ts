import { createPhysicalStoreAction } from "@/lib/actions/physical-store.action";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useCreatePhysicalStore = () => {
    const router = useRouter();

    const mutate = useMutation({
        mutationFn: createPhysicalStoreAction,
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