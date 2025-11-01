import { getVirtualStoreById } from "@/lib/actions/virtual-store.action";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Store, ExternalLink, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface StoreInfoCardProps {
    storeId: string;
    productId: string;
}

async function StoreInfoContent({ storeId, productId }: StoreInfoCardProps) {
    const store = await getVirtualStoreById(storeId);

    if (!store) return null;

    const storeRating = store.rating || 4.7;
    const totalProducts = store.totalProducts || 0;

    return (
        <Card className="my-8">
            <CardContent className="p-6">
                <div className="flex items-start gap-6">
                    {/* Store Logo */}
                    <div className="shrink-0">
                        {store.storeLogo ? (
                            <Image
                                src={store.storeLogo}
                                alt={store.storeName}
                                width={80}
                                height={80}
                                className="rounded-full border-2 border-gray-200"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Store className="h-10 w-10 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Store Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-1">{store.storeName}</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Influencer Store • Curated Collection
                                </p>

                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold">{storeRating}</span>
                                        <span className="text-sm text-muted-foreground">
                                            (245 reviews)
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="gap-1">
                                        <Users className="h-3 w-3" />
                                        12.5K Followers
                                    </Badge>
                                </div>

                                {store.desccription && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                                        {store.desccription}
                                    </p>
                                )}
                            </div>

                            <Link href={`/store/${storeId}`}>
                                <Button variant="outline" className="gap-2">
                                    Visit Store
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{totalProducts}</p>
                                <p className="text-xs text-muted-foreground">Products</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">98%</p>
                                <p className="text-xs text-muted-foreground">Positive Reviews</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">4.8</p>
                                <p className="text-xs text-muted-foreground">Avg Rating</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const StoreInfoCard = (props: StoreInfoCardProps) => {
    return (
        <Suspense fallback={<Skeleton className="h-48 w-full my-8" />}>
            <StoreInfoContent {...props} />
        </Suspense>
    );
};