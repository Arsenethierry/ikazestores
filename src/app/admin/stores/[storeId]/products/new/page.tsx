import { ProductForm } from "@/features/products/components/original-product-form/product-form";
import { ProductFormSkeleton } from "@/features/products/components/original-product-form/product-form-sekeleton";
import { getPhysicalStoreById } from "@/lib/actions/physical-store.action";
import { getAuthState } from "@/lib/user-permission";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

interface CreateProductPageProps {
    params: Promise<{
        storeId: string;
    }>;
}

async function ProductFormWrapper({ storeId }: { storeId: string }) {
    const [store, authState] = await Promise.all([
        getPhysicalStoreById(storeId),
        getAuthState()
    ]);

    if (!store) {
        notFound();
    }

    if (!authState.isPhysicalStoreOwner && !authState.isSystemAdmin) {
        redirect('/admin');
    }

    if (store.owner !== authState.user?.$id && !authState.isSystemAdmin) {
        redirect('/admin');
    }

    return <ProductForm storeData={store} />;
}

export default async function CreateProductPage({ params }: CreateProductPageProps) {
    const { storeId } = await params;

    return (
        <div className="min-h-screen">
            <Suspense fallback={<ProductFormSkeleton />}>
                <ProductFormWrapper storeId={storeId} />
            </Suspense>
        </div>
    );
}

export async function generateMetadata({ params }: CreateProductPageProps) {
    const { storeId } = await params;

    try {
        const store = await getPhysicalStoreById(storeId);

        return {
            title: `Create Product - ${store?.storeName || 'Store'}`,
            description: `Add a new product to ${store?.storeName || 'your store'} with comprehensive variant management`,
        };
    } catch {
        return {
            title: 'Create Product',
            description: 'Add a new product to your store',
        };
    }
}