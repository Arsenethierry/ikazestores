import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Store, MapPin, ExternalLink, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getStoreSubdomainUrl } from "@/lib/domain-utils";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualStoreTypes } from "@/lib/types";
import { SubscribeButton } from "../customers/subscribe-button";
import { StoreProductCount, StoreRatingDisplay, StoreSubscriberCount, SubscriptionStatus } from "../components/store-stats";

interface ExploreStoreCardProps {
    store: VirtualStoreTypes;
    viewMode?: "grid" | "list";
}

export function ExploreStoreCard({
    store,
    viewMode = "grid",
}: ExploreStoreCardProps) {
    const primaryBannerUrl = Array.isArray(store.bannerUrls)
        ? store.bannerUrls[0]
        : store.bannerUrls;

    const storeUrl = store.subDomain
        ? getStoreSubdomainUrl({ subdomain: store.subDomain })
        : `/store/${store.$id}`;

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
                                    sizes="(max-width: 768px) 100vw, 256px"
                                    priority={false}
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
                                            <AvatarImage
                                                src={store.storeLogoUrl}
                                                alt={store.storeName}
                                            />
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
                                    {store.desccription ||
                                        store.storeBio ||
                                        "Discover amazing products at this store"}
                                </p>

                                {/* Stats with Suspense */}
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <Suspense fallback={<Skeleton className="h-5 w-16" />}>
                                        <StoreRatingDisplay storeId={store.$id} />
                                    </Suspense>
                                    <Suspense fallback={<Skeleton className="h-5 w-20" />}>
                                        <StoreSubscriberCount storeId={store.$id} />
                                    </Suspense>
                                    <Suspense fallback={<Skeleton className="h-5 w-20" />}>
                                        <StoreProductCount storeId={store.$id} />
                                    </Suspense>
                                </div>

                                {/* Categories */}
                                {store.storeCategories && store.storeCategories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {store.storeCategories.slice(0, 3).map((category: any) => (
                                            <Badge
                                                key={category}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <Suspense
                                    fallback={
                                        <Button size="sm" variant="outline" disabled>
                                            <Skeleton className="h-4 w-20" />
                                        </Button>
                                    }
                                >
                                    <SubscriptionStatus storeId={store.$id}>
                                        {({ isSubscribed, userId }) => (
                                            <SubscribeButton
                                                storeId={store.$id}
                                                storeName={store.storeName}
                                                initialSubscribed={isSubscribed}
                                                userId={userId}
                                            />
                                        )}
                                    </SubscriptionStatus>
                                </Suspense>
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
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority={false}
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
                    {store.desccription ||
                        store.storeBio ||
                        "Discover amazing products"}
                </p>

                {/* Stats with Suspense */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <Suspense fallback={<Skeleton className="h-4 w-12" />}>
                            <StoreRatingDisplay storeId={store.$id} />
                        </Suspense>
                        <Suspense fallback={<Skeleton className="h-4 w-8" />}>
                            <StoreSubscriberCount storeId={store.$id} />
                        </Suspense>
                    </div>
                    <Suspense fallback={<Skeleton className="h-4 w-8" />}>
                        <StoreProductCount storeId={store.$id} />
                    </Suspense>
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
                <Suspense
                    fallback={
                        <Button size="sm" variant="outline" disabled className="flex-1">
                            <Skeleton className="h-4 w-20" />
                        </Button>
                    }
                >
                    <SubscriptionStatus storeId={store.$id}>
                        {({ isSubscribed, userId }) => (
                            <SubscribeButton
                                storeId={store.$id}
                                storeName={store.storeName}
                                initialSubscribed={isSubscribed}
                                userId={userId}
                                fullWidth
                            />
                        )}
                    </SubscriptionStatus>
                </Suspense>
                <Button size="sm" variant="outline" asChild>
                    <Link href={storeUrl} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}