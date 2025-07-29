import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CurrentUserType, PhysicalStoreTypes } from "@/lib/types";
import { StoreQuickActions } from "./store-action-button";
import { isStoreOwner } from "@/lib/user-permission";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";

export const PhyscalStoreCard = ({ store, currentUser }: { store: PhysicalStoreTypes, currentUser: CurrentUserType }) => {
    const isOwner = isStoreOwner(currentUser, store);

    return (
        <Card className="w-full max-w-sm rounded-lg shadow-md overflow-hidden border border-gray-200">
            {store.storeLogoUrl && (
                <Avatar className="mx-auto my-2">
                    <AvatarImage src={store.storeLogoUrl} alt={store.storeName} />
                    <AvatarFallback>
                        {store?.storeName
                            .split(" ")
                            .map((word: string) => word[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            )}
            <CardHeader className="px-4 pt-4 pb-2">
                <h3 className="text-lg font-semibold text-center text-gray-900">{store?.storeName}</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {store.description && (
                    <p className="text-sm text-gray-700 mb-2">{store?.description}</p>
                )}
                {store.bio && (
                    <p className="text-xs text-gray-500 mb-2">{store?.bio}</p>
                )}
                {store.address && (
                    <p className="text-sm inline-flex gap-1 font-normal text-gray-800 line-clamp-2"><MapPin /> {store?.address}, {store?.country}</p>
                )}
            </CardContent>
            <CardFooter className="p-4 flex justify-between">
                <Link
                    href={`/admin/stores/${store.$id}`}
                    className={buttonVariants({variant: "teritary"})}
                >
                    View Store
                </Link>
                {isOwner && <StoreQuickActions store={store} />}
            </CardFooter>
        </Card>
    )
}