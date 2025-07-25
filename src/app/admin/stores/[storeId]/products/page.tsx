import SpinningLoader from '@/components/spinning-loader';
import { buttonVariants } from '@/components/ui/button';
import { getVirtualStoreProducts } from '@/lib/actions/virtual-products-actions';
import { VirtualProductCard } from '@/features/products/components/product-cards/virtual-product-card';
import { ProductSekeleton } from '@/features/products/components/products-list-sekeleton';
import { productListColumns } from '@/features/products/components/products-list-table/columns';
import { ProductsDataTable } from '@/features/products/components/products-list-table/data-table';
import { OriginalProductTypes, VirtualProductTypes } from '@/lib/types';
import { getAuthState } from '@/lib/user-permission';
import Link from 'next/link';
import React, { Suspense } from 'react';
import { getStoreOriginalProducts } from '@/lib/actions/original-products-actions';

async function StoreProductsPage({
    params,
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;

    const {
        isPhysicalStoreOwner,
        isVirtualStoreOwner
    } = await getAuthState();

    const originalProducts = isPhysicalStoreOwner
        ? await getStoreOriginalProducts(storeId) : {
            documents: [],
            total: 0,
            hasMore: false
        }

    const virtualProductsResult = isVirtualStoreOwner
        ? await getVirtualStoreProducts({ virtualStoreId: storeId, limit: 20, withStoreData: true })
        : null;

        
    return (
        <div className="container mx-auto py-6">
            {isVirtualStoreOwner ? (
                <VirtualStoreProductsView
                    virtualProductsResult={virtualProductsResult}
                />
            ) : isPhysicalStoreOwner ? (
                <PhysicalStoreProductsView
                    storeId={storeId}
                    originalProducts={originalProducts}
                />
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500">You don&apos;t have permission to view products.</p>
                </div>
            )}
        </div>
    );

    function VirtualStoreProductsView({
        virtualProductsResult
    }: {
        virtualProductsResult: { success: boolean; data?: VirtualProductTypes[]; error?: string } | null
    }) {
        if (virtualProductsResult && !virtualProductsResult.success) {
            return (
                <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-900 mb-2">Error loading products</h3>
                    <p className="text-red-600 mb-6">{virtualProductsResult.error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className={buttonVariants()}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        const virtualProducts = virtualProductsResult?.data || [];

        return (
            <>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Virtual Products</h1>
                        <p className="text-gray-600">Manage your cloned products</p>
                    </div>
                    <Link
                        href={`/admin/stores/${storeId}/products/clone-products`}
                        className={buttonVariants()}
                    >
                        Add Products
                    </Link>
                </div>

                {virtualProducts.length === 0 ? (
                    <EmptyVirtualProductsState storeId={storeId} />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {virtualProducts.map((product: VirtualProductTypes) => (
                            <div key={product.$id}>
                                <Suspense fallback={<ProductSekeleton />}>
                                    <VirtualProductCard product={product} storeId={storeId} />
                                </Suspense>
                            </div>
                        ))}
                    </div>
                )}

                {virtualProducts.length >= 20 && (
                    <div className="mt-8 text-center">
                        <Link
                            href={`/admin/stores/${storeId}/products?view=all`}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            View all products →
                        </Link>
                    </div>
                )}
            </>
        )
    }

    function PhysicalStoreProductsView({
        storeId,
        originalProducts
    }: {
        storeId: string;
        originalProducts: { documents: OriginalProductTypes[]; total: number; hasMore: boolean }
    }) {
        return (
            <>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Original Products</h1>
                        <p className="text-gray-600">Manage your store&apos;s product catalog</p>
                    </div>
                </div>

                <Suspense fallback={<SpinningLoader />}>
                    <ProductsDataTable
                        columns={productListColumns}
                        data={originalProducts.documents}
                        currentStoreId={storeId}
                    />
                </Suspense>

                {originalProducts.documents.length === 0 && (
                    <EmptyOriginalProductsState storeId={storeId} />
                )}
            </>
        )
    }

    function EmptyVirtualProductsState({ storeId }: { storeId: string }) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-6">Start by cloning products from the marketplace to sell in your virtual store.</p>
                <Link
                    href={`/admin/stores/${storeId}/products/clone-products`}
                    className={buttonVariants()}
                >
                    Browse Products to Clone
                </Link>
            </div>
        );
    }

    function EmptyOriginalProductsState({ storeId }: { storeId: string }) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products created yet</h3>
                <p className="text-gray-600 mb-6">Create your first product to start building your catalog.</p>
                <Link
                    href={`/admin/stores/${storeId}/products/new`}
                    className={buttonVariants()}
                >
                    Create First Product
                </Link>
            </div>
        );
    }
}

export default StoreProductsPage;