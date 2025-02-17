import { createPhysicalStoreAction, deletePhysicalStore } from "@/lib/actions/physical-store.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export const useDeletePhysicalStore = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutate = useMutation({
        mutationFn: ([virtualStoreId, bannerIds]: [virtualStoreId: string, bannerIds: string[]]) =>
            deletePhysicalStore(virtualStoreId, bannerIds),
        onSuccess: () => {
            toast.success("Store deleted successfully")
            router.refresh();
            queryClient.invalidateQueries({ queryKey: ["physicalStores"] });
        },
        onError: () => {
            toast.error("Something went wrong")
        }
    });

    return mutate;
}