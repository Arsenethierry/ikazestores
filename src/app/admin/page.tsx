/* eslint-disable @typescript-eslint/no-unused-vars */
import AdminEntry from "@/components/admin-entry";
import { getAuthState } from "@/lib/user-permission";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function AdminPage() {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['authState'],
        queryFn: async () => {
            const authState = await getAuthState();

            const noFnState = Object.fromEntries(
                Object.entries(authState).filter(([_, value]) => typeof value !== 'function')
            );

            return noFnState
        },
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AdminEntry />
        </HydrationBoundary>
    )
}