import { ArrowUpRight, LayoutDashboard } from "lucide-react";
import { NavigationSheet } from "./navigation-sheet";
import { NavMenu } from "./nav-menu";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getAuthState } from "@/lib/user-label-permission";

export const TenantStoreNavbar = async () => {
  const {
    isVirtualStoreOwner,
    isAuthenticated
  } = await getAuthState();
  return (
    <div className="sticky top-0 z-50 bg-muted">
      <nav className="h-16 bg-background border-b">
        <div className="h-full flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href={'/'} className='font-bold text-2xl text-primary md:ml-2'>
              Ikaze<span className='text-yellow-400'>Stores</span>
            </Link>

            {/* Desktop Menu */}
            <NavMenu className="hidden md:block" />
          </div>

          <div className="flex items-center gap-3">
            {isVirtualStoreOwner && (
              <>
                <Link href={"/admin"} className={buttonVariants()}>
                  <LayoutDashboard /> Dashboard
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link href={"/sign-in"} className={buttonVariants()}>
                  Get Started <ArrowUpRight />
                </Link>
              </>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <NavigationSheet />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};