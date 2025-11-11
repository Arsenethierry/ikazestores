import { getBestProducts } from "@/lib/actions/affiliate-product-actions";
import Image from "next/image";
import Link from "next/link";

interface BestProductsServerWrapperProps {
    storeId: string;
    limit?: number;
}

export async function BestProductsServerWrapper({
    storeId,
    limit = 4,
}: BestProductsServerWrapperProps) {
    const { products, isFallback } = await getBestProducts(storeId, limit);

    if (!products || products.length === 0) {
        return null;
    }

    const sectionTitle = isFallback ? "Newly Added Products" : "Best of the month";

    return (
        <section className="py-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">{sectionTitle}</h2>
                <a
                    href={`/store/${storeId}/products`}
                    className="text-sm font-medium hover:underline text-primary"
                >
                    Shop More
                </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/store/${storeId}/products/${product.id}`}
                        className="group space-y-4"
                    >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-50">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain p-4 w-full h-full group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {product.name}
                            </h3>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <svg
                                            key={index}
                                            className={`h-4 w-4 ${index < product.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-200 text-gray-200"
                                                }`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    ))}
                                </div>
                                {product.reviewCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ({product.reviewCount})
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {product.originalPrice && (
                                    <span className="text-sm text-muted-foreground line-through">
                                        {new Intl.NumberFormat("en-RW", {
                                            style: "currency",
                                            currency: product.currency,
                                        }).format(product.originalPrice)}
                                    </span>
                                )}
                                <span className="text-lg font-bold text-primary">
                                    {new Intl.NumberFormat("en-RW", {
                                        style: "currency",
                                        currency: product.currency,
                                    }).format(product.price)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export const BestPicksSkeleton = () => {
    return (
        <section className="py-12">
            {/* Section Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="h-9 w-56 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                        {/* Product Image Skeleton */}
                        <div className="aspect-square bg-slate-200 rounded-lg animate-pulse" />

                        {/* Product Details Skeleton */}
                        <div className="space-y-3">
                            {/* Title */}
                            <div className="h-5 w-full bg-slate-200 rounded animate-pulse" />
                            <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />

                            {/* Rating */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <div
                                        key={j}
                                        className="h-4 w-4 bg-slate-200 rounded-full animate-pulse"
                                    />
                                ))}
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
                                <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};