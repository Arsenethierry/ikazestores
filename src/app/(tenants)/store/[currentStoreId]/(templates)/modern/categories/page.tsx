import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getVirtualStoreById } from '@/lib/actions/virtual-store.action';
import Link from 'next/link';

export const revalidate = 3600;

export default async function ModernCategoriesPage({
    params,
}: {
    params: Promise<{ currentStoreId: string }>;
}) {
    const { currentStoreId } = await params;
    const store = await getVirtualStoreById(currentStoreId);

    if (!store) notFound();

    // TODO: Fetch categories from your database
    const categories = [
        { id: '1', name: 'Electronics', productCount: 45, image: '/placeholder.jpg' },
        { id: '2', name: 'Fashion', productCount: 120, image: '/placeholder.jpg' },
        { id: '3', name: 'Home & Garden', productCount: 78, image: '/placeholder.jpg' },
        { id: '4', name: 'Sports', productCount: 32, image: '/placeholder.jpg' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2">Shop by Category</h1>
                <p className="text-muted-foreground">Browse our product categories</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/store/${currentStoreId}/modern/products?category=${category.id}`}
                        className="group"
                    >
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h3 className="text-white text-2xl font-bold">{category.name}</h3>
                            </div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            {category.productCount} products
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
