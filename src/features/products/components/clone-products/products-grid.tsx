import { CurrentUserType, OriginalProductTypes } from "@/lib/types";
import { Package } from "lucide-react";
import { PhysicalProductCard } from "../product-cards/physical-product-card";

interface ProductsGridProps {
    products: OriginalProductTypes[];
    virtualStoreId: string;
    user: CurrentUserType;
}

export function ProductsGrid({ products, virtualStoreId, user }: ProductsGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <PhysicalProductCard
                    key={product.$id}
                    product={product}
                    virtualStoreId={virtualStoreId}
                    user={user}
                    isSystemAdmin={false}
                    isPhysicalStoreOwner={false}
                    isVirtualStoreOwner={true}
                />
            ))}
        </div>
    );
}