import React from 'react';
import HeroSection from "@/features/stores/components/home-page/hero-section";
import { getAllCollectionsByStoreId } from '@/lib/actions/collections-actions';
import { getQueryClient } from '@/lib/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { collectionKeys } from '@/hooks/queries-and-mutations/query-keys';

export const TenantHomeHeroSection = async ({
    currentStoreId
}: {
    currentStoreId: string;
}) => {
    const queryClient = getQueryClient();

    await queryClient.prefetchQuery({
        queryKey: collectionKeys.byStore(currentStoreId),
        queryFn: () => getAllCollectionsByStoreId({
            storeId: currentStoreId,
            featured: true,
            limit: 5
        }),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <HeroSection storeId={currentStoreId} />
        </HydrationBoundary>
    );
}