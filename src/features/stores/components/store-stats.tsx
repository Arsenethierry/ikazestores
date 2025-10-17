import {
    getStoreSubscriberCount,
    getStoreProductCount,
    getStoreRating,
    checkStoreSubscription,
} from "@/lib/actions/explore-stores.action";
import { getAuthState } from "@/lib/user-permission";
import { Users, Package, Star } from "lucide-react";

interface StoreSubscriberCountProps {
    storeId: string;
}

export async function StoreSubscriberCount({
    storeId,
}: StoreSubscriberCountProps) {
    const count = await getStoreSubscriberCount(storeId);

    return (
        <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">{count || 0}</span>
        </div>
    );
}

interface StoreProductCountProps {
    storeId: string;
}

export async function StoreProductCount({ storeId }: StoreProductCountProps) {
    const count = await getStoreProductCount(storeId);

    return (
        <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="h-3 w-3 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">{count || 0}</span>
        </div>
    );
}

interface StoreRatingDisplayProps {
    storeId: string;
}

export async function StoreRatingDisplay({ storeId }: StoreRatingDisplayProps) {
    const { averageRating, totalReviews } = await getStoreRating(storeId);

    if (!averageRating || averageRating === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1">
            <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-xs md:text-sm">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs md:text-sm">
                ({totalReviews})
            </span>
        </div>
    );
}

interface SubscriptionStatusProps {
    storeId: string;
    children: (props: { isSubscribed: boolean; userId?: string }) => React.ReactNode;
}

export async function SubscriptionStatus({
    storeId,
    children,
}: SubscriptionStatusProps) {
    const { user: currentUser } = await getAuthState();
    const userId = currentUser?.$id;

    const isSubscribed = await checkStoreSubscription(storeId, userId);

    return <>{children({ isSubscribed, userId })}</>;
}