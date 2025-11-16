import Link from 'next/link';
import { Phone, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoriesMegaMenu } from './categories-megamenu';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthState } from '@/lib/user-permission';
import { CartNavbarWrapper } from './cart-navbar-wrapper';
import { CurrentStoreLogo } from '@/components/navbars/tenant/store-logo';
import { ProductSearchField } from '@/components/search/virtual-products-search';

interface ModernNavbarProps {
    currentStoreId: string;
    storeName: string;
    storeLogo?: string | null;
}

export const ModernNavbar = async ({
    currentStoreId,
    storeName,
    storeLogo,
}: ModernNavbarProps) => {
    const { isAuthenticated } = await getAuthState();

    return (
        <header className="w-full bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
            {/* Top Bar */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-10 text-xs">
                        <div className="flex items-center gap-4">
                            <Link href="/about" className="hover:text-slate-300 transition-colors">
                                About Us
                            </Link>
                            <Link href="/partners" className="hover:text-slate-300 transition-colors">
                                Our Partners
                            </Link>
                            <Link href="/work" className="hover:text-slate-300 transition-colors">
                                Work With Us
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/track-order" className="hover:text-slate-300 transition-colors">
                                Track You Order
                            </Link>
                            <Link href="/contact" className="hover:text-slate-300 transition-colors">
                                Contact Us
                            </Link>
                            <Link href="/faqs" className="hover:text-slate-300 transition-colors">
                                FAQs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20 gap-6">
                    <CurrentStoreLogo currentStoreId={currentStoreId} />

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl">
                        <ProductSearchField />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Phone */}
                        <div className="hidden lg:flex flex-col items-end">
                            <span className="text-xs text-slate-400">Hotline 24/7</span>
                            <Link href="tel:(505) 285-5028" className="text-sm font-semibold hover:text-primary transition-colors">
                                (505) 285-5028
                            </Link>
                        </div>

                        {/* Wishlist */}
                        <Button variant="ghost" size="icon" className="hover:bg-slate-800" asChild>
                            <Link href="/saved-items">
                                <Heart className="h-5 w-5" />
                            </Link>
                        </Button>

                        {/* Cart */}
                        <Suspense fallback={
                            <div className="relative">
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>
                        }>
                            <CartNavbarWrapper />
                        </Suspense>

                        {/* Account */}
                        <Button variant="ghost" className="hover:bg-slate-800 gap-2" asChild>
                            <Link href={isAuthenticated ? "/profile" : "/sign-in"}>
                                <User className="h-5 w-5" />
                                <span className="hidden md:inline">
                                    {isAuthenticated ? "Account" : "Login / Register"}
                                </span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categories Bar */}
            <div className="bg-primary">
                <div className="container mx-auto px-4">
                    <div className="flex items-center h-14 overflow-x-auto scrollbar-hide">
                        <Suspense fallback={
                            <div className="flex gap-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-24 rounded-md" />
                                ))}
                            </div>
                        }>
                            <CategoriesMegaMenu storeId={currentStoreId} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </header>
    );
};


export const ModernNavbarSkeleton = () => {
    return (
        <header className="w-full bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
            {/* Top Bar Skeleton */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-10">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-3 w-16 bg-slate-700" />
                            <Skeleton className="h-3 w-20 bg-slate-700" />
                            <Skeleton className="h-3 w-20 bg-slate-700" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-3 w-24 bg-slate-700" />
                            <Skeleton className="h-3 w-20 bg-slate-700" />
                            <Skeleton className="h-3 w-12 bg-slate-700" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navbar Skeleton */}
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20 gap-6">
                    {/* Logo Skeleton */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
                        <Skeleton className="h-6 w-32 bg-slate-800" />
                    </div>

                    {/* Search Bar Skeleton */}
                    <div className="flex-1 max-w-2xl">
                        <Skeleton className="h-11 w-full rounded-full bg-slate-800" />
                    </div>

                    {/* Right Actions Skeleton */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="hidden lg:flex flex-col items-end gap-1">
                            <Skeleton className="h-3 w-20 bg-slate-800" />
                            <Skeleton className="h-4 w-28 bg-slate-800" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                        <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
                        <Skeleton className="h-10 w-32 rounded-md bg-slate-800" />
                    </div>
                </div>
            </div>

            {/* Categories Bar Skeleton */}
            <div className="bg-primary/90">
                <div className="container mx-auto px-4">
                    <div className="flex items-center h-14 gap-1 overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-8 w-32 rounded-md bg-white/20 flex-shrink-0"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
};