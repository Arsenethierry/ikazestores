"use client";

import { VirtualProductTypes } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_RECENT_ITEMS = 5
const RECENT_VIEWS_KEY = 'recently_viewed_products'

interface LocalStorageProductId {
    $id: string;
    title: string;
}
export const useRecentlyViewedProducts = () => {
    const [recentProducts, setRecentProducts] = useState<LocalStorageProductId[]>([]);

    const getRecentlyViewedProducts = (): LocalStorageProductId[] => {
        if (typeof window === 'undefined') return [];

        try {
            const storeData = localStorage.getItem(RECENT_VIEWS_KEY);
            return storeData ? JSON.parse(storeData) : []
        } catch {
            return []
        }
    };

    const addToRecentlyViewed = (product: VirtualProductTypes) => {
        if (typeof window === 'undefined') return;

        try {
            const recentItems = getRecentlyViewedProducts();
            const productToStore: LocalStorageProductId = {
                $id: product.$id,
                title: product.title
            }

            const filteredItems = recentItems.filter(item => item.$id !== product.$id);
            const newRecentItems = [productToStore, ...filteredItems].slice(0, MAX_RECENT_ITEMS);
            localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(newRecentItems));

            setRecentProducts(newRecentItems)
        } catch {
            return;
        }
    };

    const clearRecentlyViewed = () => {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(RECENT_VIEWS_KEY);
        setRecentProducts([])
    };

    useEffect(() => {
        setRecentProducts(getRecentlyViewedProducts())

        const handleStorageChange = () => {
            setRecentProducts(getRecentlyViewedProducts())
        }

        window.addEventListener('storage', handleStorageChange)
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, []);

    return {
        recentProducts,
        addToRecentlyViewed,
        clearRecentlyViewed
    }
}

export const ProductViewer = ({ product }: { product: VirtualProductTypes }) => {
    const { addToRecentlyViewed } = useRecentlyViewedProducts();

    useEffect(() => {
        if (product) {
            addToRecentlyViewed(product)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product]);

    return null
};

export const RecentlyViewedProducts = () => {
    const { recentProducts, clearRecentlyViewed } = useRecentlyViewedProducts();
    const router = useRouter();

    if (recentProducts.length === 0) {
        return <div className="p-4 text-center text-sm text-muted-foreground">No recently viewed items</div>
    }

    return (
        <div className="grid gap-4 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Recently Viewed</h3>
                <button
                    onClick={clearRecentlyViewed}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Clear all
                </button>
            </div>
            <ul className="grid gap-2 max-h-[300px] overflow-y-auto">
                {recentProducts.map(product => (
                    <li
                        key={product.$id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => router.push(`/products/${slugify(product.title)}/${product.$id}`)}
                    >
                        <div>
                            <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}