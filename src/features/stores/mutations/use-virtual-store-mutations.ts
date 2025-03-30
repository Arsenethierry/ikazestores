import { deleteVirtualStore } from "@/lib/actions/vitual-store.action";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useDeleteVirtualStore = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutate = useMutation({
        mutationFn: ([virtualStoreId, bannerIds]: [virtualStoreId: string, bannerIds: string[]]) =>
            deleteVirtualStore(virtualStoreId, bannerIds),
        onSuccess: () => {
            toast.success("Store deleted successfully")
            router.refresh();
            queryClient.invalidateQueries({ queryKey: ["virtualStores"] });
        },
        onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : "Something went wrong"
            toast.error(`${errorMessage}`)
        }
    });

    return mutate;
}