import { getAllCollectionsByStoreId } from "@/lib/actions/collections-actions";
import { DualHeroSection, DualHeroSkeleton } from "./dual-hero-section";

interface HeroCollectionsServerWrapperProps {
    storeId: string;
    storeName: string;
}

export async function HeroCollectionsServerWrapper({
    storeId,
    storeName,
}: HeroCollectionsServerWrapperProps) {
    try {
        const collections = await getAllCollectionsByStoreId({
            storeId,
            featured: true,
            limit: 5,
        });

        if (!collections?.documents || collections.documents.length === 0) {
            // Fallback to dummy hero with ad
            return (
                <DualHeroSection
                    banners={[
                        {
                            id: "fallback-1",
                            imageUrl:
                                "https://images.pexels.com/photos/1619801/pexels-photo-1619801.jpeg?auto=compress&cs=tinysrgb&w=1200",
                            title: `Welcome to ${storeName}`,
                            subtitle: "Discover Amazing Products",
                            ctaText: "Shop Now",
                            ctaLink: `/store/${storeId}/products`,
                            backgroundColor: "#f5f5f5",
                        },
                    ]}
                    featuredOffer={{
                        title: "Featured Offer",
                        label: "Special Deal",
                        price: "Limited Time",
                        imageUrl:
                            "https://images.pexels.com/photos/3945685/pexels-photo-3945685.jpeg?auto=compress&cs=tinysrgb&w=400",
                        backgroundColor: "#2c5f5d",
                    }}
                />
            );
        }

        // Transform collections into hero banners
        const banners = collections.documents.map((collection, index) => ({
            id: collection.$id,
            imageUrl:
                collection.heroImageUrl ||
                collection.bannerImageUrl ||
                "https://images.pexels.com/photos/1619801/pexels-photo-1619801.jpeg?auto=compress&cs=tinysrgb&w=1200",
            title: collection.heroTitle || collection.collectionName,
            subtitle: collection.heroSubtitle || collection.description || "",
            ctaText: collection.heroButtonText || "Shop Collection",
            ctaLink: `/store/${storeId}/collections/${collection.$id}`,
            backgroundColor: "#f5f5f5",
        }));

        // Featured offer (ad placeholder)
        const featuredOffer = {
            title: "Premium Headphones",
            label: "Special Offer",
            price: "Shop Now",
            imageUrl:
                "https://images.pexels.com/photos/3945685/pexels-photo-3945685.jpeg?auto=compress&cs=tinysrgb&w=400",
            backgroundColor: "#2c5f5d",
        };

        return <DualHeroSection banners={banners} featuredOffer={featuredOffer} />;
    } catch (error) {
        console.error("[HeroCollectionsServerWrapper] Error:", error);

        // Error fallback
        return (
            <DualHeroSection
                banners={[
                    {
                        id: "error-fallback",
                        imageUrl:
                            "https://images.pexels.com/photos/1619801/pexels-photo-1619801.jpeg?auto=compress&cs=tinysrgb&w=1200",
                        title: `Welcome to ${storeName}`,
                        subtitle: "Discover Amazing Products",
                        ctaText: "Shop Now",
                        ctaLink: `/store/${storeId}/products`,
                        backgroundColor: "#f5f5f5",
                    },
                ]}
                featuredOffer={{
                    title: "Featured Products",
                    label: "Explore",
                    price: "Shop Now",
                    imageUrl:
                        "https://images.pexels.com/photos/3945685/pexels-photo-3945685.jpeg?auto=compress&cs=tinysrgb&w=400",
                    backgroundColor: "#2c5f5d",
                }}
            />
        );
    }
}

export { DualHeroSkeleton };