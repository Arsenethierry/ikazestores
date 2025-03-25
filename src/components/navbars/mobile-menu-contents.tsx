import Link from "next/link";
import { SearchField } from "../search/search-field";
import { Heart, ShoppingCart } from "lucide-react";
import LogoutButton from "@/features/auth/components/logout-button";
import { AuthStatus } from "@/lib/types";

export const MobileMenuContent = ({ isAuthenticated, isPhysicalStoreOwner, isVirtualStoreOwner }: AuthStatus) => (
    <>
        <div className="mb-4">
            <SearchField mobile />
        </div>

        <Link href="/cart" className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
        </Link>

        <Link href="/favorites" className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorites
        </Link>

        <div className="border-t border-white/20 pt-4">
            <Link href="/" className="block py-2">Top Deals</Link>
            <Link href="/" className="block py-2">Deal of the Day</Link>
            <Link href="/" className="block py-2">Men</Link>
            <Link href="/" className="block py-2">Women</Link>
            <Link href="/sell" className="block py-2">Start Selling</Link>
            <Link href="/explore-stores" className="block py-2">Explore Stores</Link>
        </div>

        <div className="border-t border-white/20 pt-4">
            {isAuthenticated ? (
                <>
                    <Link href="/profile" className="block py-2">Profile</Link>
                    <Link href="/my-orders" className="block py-2">My Orders</Link>
                    {(isPhysicalStoreOwner || isVirtualStoreOwner) && (
                        <Link href="/admin" className="block py-2">Dashboard</Link>
                    )}
                    <LogoutButton />
                </>
            ) : (
                <>
                    <Link href="/sign-in" className="block py-2">Log In</Link>
                    <Link href="/sign-up" className="block py-2">Create Account</Link>
                </>
            )}
        </div>
    </>
);