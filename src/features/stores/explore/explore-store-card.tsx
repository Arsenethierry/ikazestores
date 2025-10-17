"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Store,
    MapPin,
    Star,
    Users,
    Package,
    Bell,
    BellOff,
    ExternalLink,
    CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EnhancedVirtualStore } from "@/lib/actions/explore-stores.action";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { subscribeUserToStore } from "@/lib/actions/store-subscribers.action";
import { useCurrentUser } from "@/features/auth/queries/use-get-current-user";
import { getStoreSubdomainUrl } from "@/lib/domain-utils";

interface ExploreStoreCardProps {
    store: EnhancedVirtualStore;
    viewMode?: "grid" | "list";
    isSubscribed?: boolean;
}

export function ExploreStoreCard({ store, viewMode = "grid", isSubscribed: initialSubscribed = false }: ExploreStoreCardProps) {
    console.log("initialSubscribed: ", store)
    const { data: currentUser } = useCurrentUser();
    const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
    const [isPending, startTransition] = useTransition();

    const primaryBannerUrl = Array.isArray(store.bannerUrls)
        ? store.bannerUrls[0]
        : store.bannerUrls;

    const storeUrl = store.subDomain
        ? getStoreSubdomainUrl({ subdomain: store.subDomain })
        : `/store/${store.$id}`;

    const handleSubscribe = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUser) {
            toast.error("Please sign in to subscribe to stores");
            return;
        }

        startTransition(async () => {
            try {
                const result = await subscribeUserToStore(
                    store.$id,
                    currentUser.$id,
                    currentUser.email
                );

                if (result.success) {
                    setIsSubscribed(true);
                    toast.success(`Subscribed to ${store.storeName}!`);
                } else {
                    toast.error(result.error || "Failed to subscribe");
                }
            } catch (error) {
                toast.error("An error occurred");
            }
        });
    };

    const renderRating = () => {
        if (!store.averageRating || store.averageRating === 0) return null;

        return (
            <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{store.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">
                    ({store.totalReviews})
                </span>
            </div>
        );
    };

    if (viewMode === "list") {
        return (
            <Card className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <Link href={storeUrl} target="_blank" className="md:w-64 shrink-0">
                        <div className="relative h-48 md:h-full w-full">
                            {primaryBannerUrl ? (
                                <Image
                                    src={primaryBannerUrl}
                                    alt={store.storeName}
                                    fill
                                    className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <Store className="h-12 w-12 text-muted-foreground" />
                                </div>
                            )}
                            {store.isVerified && (
                                <div className="absolute top-2 right-2">
                                    <Badge className="bg-green-500">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Verified
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                                {/* Store Header */}
                                <div className="flex items-center gap-3">
                                    {store.storeLogoUrl && (
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={store.storeLogoUrl} alt={store.storeName} />
                                            <AvatarFallback>{store.storeName[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        <Link href={storeUrl} target="_blank">
                                            <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                                                {store.storeName}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {store.operatingCountry}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {store.desccription || store.storeBio || "Discover amazing products at this store"}
                                </p>

                                {/* Stats */}
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    {renderRating()}
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{store.subscriberCount || 0} subscribers</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Package className="h-4 w-4" />
                                        <span>{store.productCount || 0} products</span>
                                    </div>
                                </div>

                                {/* Categories */}
                                {store.storeCategories && store.storeCategories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {store.storeCategories.slice(0, 3).map((category: any) => (
                                            <Badge key={category} variant="secondary" className="text-xs">
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <Button
                                    size="sm"
                                    variant={isSubscribed ? "outline" : "teritary"}
                                    onClick={handleSubscribe}
                                    disabled={isPending || isSubscribed}
                                    className="whitespace-nowrap"
                                >
                                    {isSubscribed ? (
                                        <>
                                            <Bell className="h-4 w-4 mr-2" />
                                            Subscribed
                                        </>
                                    ) : (
                                        <>
                                            <BellOff className="h-4 w-4 mr-2" />
                                            Subscribe
                                        </>
                                    )}
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={storeUrl} target="_blank">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Visit Store
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    // Grid View (Default)
    return (
        <Card className="hover:shadow-lg transition-shadow group">
            <Link href={storeUrl} target="_blank">
                <CardHeader className="p-0 relative">
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        {primaryBannerUrl ? (
                            <Image
                                src={primaryBannerUrl}
                                alt={store.storeName}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Store className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}
                        {store.isVerified && (
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Verified
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Link>

            <CardContent className="p-4 space-y-3">
                {/* Store Header */}
                <div className="flex items-center gap-3">
                    {store.storeLogoUrl && (
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={store.storeLogoUrl} alt={store.storeName} />
                            <AvatarFallback>{store.storeName[0]}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                        <Link href={storeUrl} target="_blank">
                            <h3 className="font-semibold text-lg truncate hover:text-primary transition-colors">
                                {store.storeName}
                            </h3>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{store.operatingCountry}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {store.desccription || store.storeBio || "Discover amazing products"}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        {renderRating()}
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span className="text-xs">{store.subscriberCount || 0}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span className="text-xs">{store.productCount || 0}</span>
                    </div>
                </div>

                {/* Categories */}
                {store.storeCategories && store.storeCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {store.storeCategories.slice(0, 2).map((category: any) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                    size="sm"
                    variant={isSubscribed ? "outline" : "teritary"}
                    onClick={handleSubscribe}
                    disabled={isPending || isSubscribed}
                    className="flex-1"
                >
                    {isSubscribed ? (
                        <>
                            <Bell className="h-3 w-3 mr-1" />
                            Subscribed
                        </>
                    ) : (
                        <>
                            <BellOff className="h-3 w-3 mr-1" />
                            Subscribe
                        </>
                    )}
                </Button>
                <Button size="sm" variant="outline" asChild>
                    <Link href={storeUrl} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}