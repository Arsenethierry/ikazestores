import { VirtualProductCard } from "@/features/products/components/product-cards/virtual-product-card";
import { ProductSekeleton } from "@/features/products/components/products-list-sekeleton";
import { VirtualProductTypes } from "@/lib/types";
import { Suspense } from "react";

export const FeaturedProducts = ({
    storeProducts,
    currentStoreId,
}: {
    storeProducts: VirtualProductTypes[] | undefined,
    currentStoreId: string,
}) => (
    <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Featured Products
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Handpicked selections from our premium collection
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {storeProducts &&
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="group">
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
                                <div className="relative overflow-hidden">
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            New
                                        </span>
                                    </div>
                                    <Suspense fallback={<ProductSekeleton />}>
                                        <VirtualProductCard
                                            product={storeProducts[0]}
                                            storeId={currentStoreId}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    </section>
)