import { Badge } from "@/components/ui/badge";
import { Store, Users, TrendingUp } from "lucide-react";

interface ExploreStoresHeroProps {
    totalStores: number;
}

export function ExploreStoresHero({ totalStores }: ExploreStoresHeroProps) {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-16 md:py-24">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="relative main-container">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="flex justify-center">
                        <Badge variant="secondary" className="text-sm px-4 py-2">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Discover Curated Stores
                        </Badge>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                        Explore Stores
                    </h1>

                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                        Discover unique products from influencer-curated stores around the world.
                        Each store offers handpicked items with personalized service.
                    </p>

                    <div className="flex flex-wrap justify-center gap-8 pt-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                                <Store className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-bold">{totalStores}+</p>
                                <p className="text-sm text-white/80">Active Stores</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-bold">1000+</p>
                                <p className="text-sm text-white/80">Happy Customers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}