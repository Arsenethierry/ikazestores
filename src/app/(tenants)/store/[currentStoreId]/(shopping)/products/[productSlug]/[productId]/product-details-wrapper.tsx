"use client";

import { NoItemsCard } from "@/components/no-items-card";
import SpinningLoader from "@/components/spinning-loader";
import { ProductDetails } from "@/features/products/components/product-details";
import { getVirtualProductById } from "@/lib/actions/affiliate-product-actions";
import { VirtualProductTypes } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

interface ProductDetailsWrapperProps {
    productId: string;
    initialProduct: VirtualProductTypes;
    initialColorParam?: string;
}

export const ProductDetailsWrapper = ({
    productId,
    initialProduct,
    initialColorParam
}: ProductDetailsWrapperProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        data: product,
        isLoading,
        error
    } = useQuery({
        queryKey: ['virtual-product', productId],
        queryFn: () => getVirtualProductById(productId),
        initialData: initialProduct,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    if (isLoading) {
        return <SpinningLoader />;
    }

    if (error || !product) {
        return (
            <NoItemsCard
                title="Error Loading Product"
                description="We encountered an error while loading this product."
            />
        );
    }

    return (
        <ProductDetails
            product={product}
            initialColorParam={initialColorParam}
        />
    );
}