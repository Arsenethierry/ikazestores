import { Loader, Menu } from "lucide-react";
import Link from "next/link";
import { getAuthState } from "@/lib/user-permission";
import { AllCategories } from "../all-categories";
import { CartNavButton } from "@/features/cart/components/cart-navbar-button";
import { AccountDropdown } from "../account-dropdown-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProductSearchField } from "@/components/search/virtual-products-search";
import { Suspense } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MobileMenuContent } from "../mobile-menu-contents";
import { ProductsCollectionsList } from "./products-collections-list";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentStoreLogo } from "./store-logo";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport } from "@/components/ui/navigation-menu";
import { RecentlyViewedProducts } from "@/hooks/queries-and-mutations/use-recently-viewed-products";

export const TenantStoreNavbar = async ({ currentStoreId }: { currentStoreId: string }) => {
  const {
    isSystemAdmin,
    isAuthenticated,
    isVirtualStoreOwner,
    isPhysicalStoreOwner,
  } = await getAuthState();

  return (
    <>
      <div className='main-container hidden md:flex justify-between items-center bg-primary font-sans text-white font-medium flex-between border-b border-blue-50/20 h-8'>
        <div className='flex gap-3'>
          <Link href={'/'} className='text-sm hover:text-white/80'>Language: English</Link>
        </div>

        <div className='flex gap-3'>
          <Link href={'/'} className='text-sm hover:text-white/80'>About Us</Link>
          <Link href={'/'} className='text-sm hover:text-white/80'>Contact Us</Link>
          <Link href={'/'} className='text-sm hover:text-white/80'>FAQs</Link>
        </div>
      </div>

      <div className='main-container flex justify-between items-center z-50 font-sans flex-between h-16 sticky top-0 bg-primary px-4'>
        <div className='md:hidden'>
          <Sheet>
            <SheetTitle className="hidden"></SheetTitle>
            <SheetTrigger>
              <Menu className='text-white h-6 w-6' />
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary text-white w-[300px]">
              <div className="flex flex-col gap-6 pt-8">
                <MobileMenuContent
                  isAuthenticated={isAuthenticated}
                  isPhysicalStoreOwner={isPhysicalStoreOwner}
                  isVirtualStoreOwner={isVirtualStoreOwner}
                  isSystemAdmin={isSystemAdmin}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Suspense fallback={<></>}>
          <CurrentStoreLogo currentStoreId={currentStoreId} />
        </Suspense>

        <div className='hidden md:flex gap-3 w-full max-w-xl mx-8'>
          <ProductSearchField />
        </div>

        <div className='flex gap-3 items-center'>
          <div className='md:hidden'>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-screen max-w-full mt-2">
                <div className="p-4">
                  <ProductSearchField />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Suspense fallback={<Loader className='size-5 animate-spin text-white m-auto' />}>
            <CartNavButton />
          </Suspense>

          <AccountDropdown
            isAuthenticated={isAuthenticated}
            isPhysicalStoreOwner={isPhysicalStoreOwner}
            isVirtualStoreOwner={isVirtualStoreOwner}
            isSystemAdmin={isSystemAdmin}
          />
        </div>
      </div>

      <div className='main-container hidden md:flex justify-between bg-primary font-sans flex-between text-white font-medium border-b border-blue-50/20 h-14 relative'>
        <div className='flex gap-6 items-center'>
          <AllCategories />
          <Suspense fallback={<Skeleton className="h-2 w-7" />}>
            <ProductsCollectionsList currentStoreId={currentStoreId} />
          </Suspense>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Recently viewed</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="md:w-[400px] lg:w-[500px] max-h-[400px] overflow-y-auto">
                    <RecentlyViewedProducts />
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuViewport className="origin-top-right" />
          </NavigationMenu>
        </div>
        <div className='flex gap-6 items-center'>
          <Link href={'/products'} className='hover:text-white/80 hover:underline'>Shop products</Link>
          <Link href={'/saved-items'} className='hover:text-white/80 hover:underline'>Saved items</Link>
        </div>
      </div>
    </>
  );
};