import AdminEntry from "@/components/admin-entry";
import { getAuthState } from "@/lib/user-permission";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function AdminPage() {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['authState'],
        queryFn: getAuthState,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AdminEntry />
        </HydrationBoundary>
    )
}