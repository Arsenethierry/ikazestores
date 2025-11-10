import Link from 'next/link';
import Image from 'next/image';
import { getCategoriesWithInheritance } from '@/lib/actions/catalog-server-actions';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HotCategoriesSectionProps {
    storeId: string;
    maxCategories?: number;
}

export async function HotCategoriesSection({
    storeId,
    maxCategories = 8,
}: HotCategoriesSectionProps) {

    const { documents: categories, error } = await getCategoriesWithInheritance(storeId);

    if (error || !categories || categories.length === 0) {
        return null;
    }

    const displayCategories = categories.slice(0, maxCategories);

    return (
        <div className="py-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Flame className="h-6 w-6 text-orange-500" />
                    <h2 className="text-3xl font-bold">Hot categories</h2>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {displayCategories.map((category) => (
                    <Link
                        key={category.$id}
                        href={`/products?category=${encodeURIComponent(category.categoryName || '')}`}
                        className="group flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-accent transition-all duration-300"
                        prefetch={false}
                    >
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
                            {category.iconUrl ? (
                                <Image
                                    src={category.iconUrl}
                                    alt={category.categoryName || 'Category'}
                                    fill
                                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                                    sizes="80px"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                    <span className="text-2xl font-bold text-primary">
                                        {category.categoryName?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                                {category.categoryName}
                            </h3>
                            {category.children && category.children.length > 0 && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                    {category.children.length} items
                                </Badge>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export const HotCategoriesSkeleton = () => {
    return (
        <div className="py-12">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                </div>
            </div>

            {/* Categories Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 p-4">
                        {/* Icon Skeleton */}
                        <Skeleton className="w-20 h-20 rounded-lg" />

                        {/* Text Skeleton */}
                        <div className="w-full space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-12 mx-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};