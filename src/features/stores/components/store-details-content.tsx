"use client";

import { VirtualStoreTypes } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    Globe,
    MapPin,
    Package,
    Star,
    Store as StoreIcon,
    Users,
} from "lucide-react";
import { format } from "date-fns";
import { StoreReviewForm } from "../reviews/store-review-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getStoreInitials } from "@/lib/utils";
import { StoreRatingSummary } from "../reviews/store-rating-summary";
import { StoreReviewsList } from "../reviews/store-reviews-list";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreDetailsContentProps {
    storeId: string;
    store: VirtualStoreTypes;
}

export function StoreDetailsContent({ storeId, store }: StoreDetailsContentProps) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Store Header */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Store Logo */}
                        <Avatar className="h-24 w-24 md:h-32 md:w-32">
                            {store.storeLogoUrl && (
                                <AvatarImage src={store.storeLogoUrl} alt={store.storeName} />
                            )}
                            <AvatarFallback className="text-2xl">
                                {getStoreInitials(store.storeName)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Store Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold">{store.storeName}</h1>
                                    <Badge variant="secondary">Virtual Store</Badge>
                                </div>
                                {store.storeBio && (
                                    <p className="text-muted-foreground">{store.storeBio}</p>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        Joined {format(new Date(store.$createdAt), "MMM yyyy")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span>{store.vitualProducts?.length || 0} Products</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{store.operatingCountry || "Global"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span>{store.subDomain}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <Link href={`/store/${storeId}`}>
                                <Button variant="teritary" className="w-full">
                                    <StoreIcon className="h-4 w-4 mr-2" />
                                    Visit Store
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="reviews" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
                    <TabsTrigger value="about">About Store</TabsTrigger>
                </TabsList>

                {/* Reviews Tab */}
                <TabsContent value="reviews" className="space-y-6">
                    {/* Rating Summary */}
                    <StoreRatingSummary storeId={storeId} />

                    <Separator />

                    {/* Review Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Write a Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StoreReviewForm storeId={storeId} />
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Reviews List */}
                    <StoreReviewsList storeId={storeId} />
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about">
                    <Card>
                        <CardHeader>
                            <CardTitle>About {store.storeName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Description */}
                            {store.desccription && (
                                <div>
                                    <h3 className="font-semibold mb-2">Store Description</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {store.desccription}
                                    </p>
                                </div>
                            )}

                            {/* Store Details */}
                            <div>
                                <h3 className="font-semibold mb-3">Store Information</h3>
                                <div className="grid gap-3">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Operating Region</span>
                                        <span className="font-medium">{store.operatingCountry}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Currency</span>
                                        <span className="font-medium">{store.countryCurrency}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Products</span>
                                        <span className="font-medium">
                                            {store.vitualProducts?.length || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Member Since</span>
                                        <span className="font-medium">
                                            {format(new Date(store.$createdAt), "MMMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Store Banner */}
                            {store.bannerUrls && store.bannerUrls.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Store Gallery</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {store.bannerUrls.map((url, idx) => (
                                            <img
                                                key={idx}
                                                src={url}
                                                alt={`${store.storeName} banner ${idx + 1}`}
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export function StoreDetailsSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
                        <div className="flex-1 space-y-4">
                            <div>
                                <Skeleton className="h-8 w-64 mb-2" />
                                <Skeleton className="h-4 w-full max-w-md" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-6 w-full" />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Skeleton */}
            <div className="space-y-6">
                <Skeleton className="h-10 w-full max-w-[400px]" />

                {/* Rating Summary Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-4 w-full" />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Review Form Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                </Card>

                {/* Reviews List Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-3 pb-6 border-b last:border-0">
                                <div className="flex items-start gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-3">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}