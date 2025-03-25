import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Loader, Menu, ShoppingCart } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AllCategories } from './all-categories';
import { NavigationMenuCategories } from './navigation-menu';
import { getAuthState } from '@/lib/user-label-permission';
import { Suspense } from 'react';
import { Badge } from '../ui/badge';
import { getCart } from '@/lib/cart';
import { SearchField } from '../search/search-field';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/sheet';
import { AccountDropdown } from './account-dropdown-menu';
import { MobileMenuContent } from './mobile-menu-contents';

export default async function MarketplaceNavbar() {
    const {
        isSystemAdmin,
        isAuthenticated,
        isVirtualStoreOwner,
        isPhysicalStoreOwner
    } = await getAuthState();

    const cart = await getCart();

    return (
        <>
            <div className='main-container hidden md:flex justify-between items-center bg-primary font-sans text-white font-medium flex-between border-b border-blue-50/20 h-8'>
                <div className='flex gap-3'>
                    <Link href={'/'} className='text-sm hover:text-white/80'>Language: English</Link>
                    <Link href={'/'} className='text-sm hover:text-white/80'>Currency</Link>
                </div>
                <div className='flex gap-3'>
                    <Link href={'/'} className='text-sm hover:text-white/80'>About Us</Link>
                    <Link href={'/'} className='text-sm hover:text-white/80'>Contact Us</Link>
                    <Link href={'/'} className='text-sm hover:text-white/80'>FAQs</Link>
                </div>
            </div>

            <div className='main-container flex justify-between items-center z-50 font-sans flex-between h-16 sticky top-0 bg-primary px-4'>
                {/* Mobile Menu Trigger */}
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

                <Link href={'/'} className='font-bold text-2xl text-white md:ml-0'>
                    Ikaze<span className='text-yellow-400'>Online</span>
                </Link>

                {/* Desktop Search - Hidden on mobile */}
                <div className='hidden md:flex gap-3 w-full max-w-xl mx-8'>
                    <SearchField />
                </div>

                <div className='flex gap-3 items-center'>
                    {/* Mobile Search Trigger */}
                    <div className='md:hidden'>
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-screen max-w-full mt-2">
                                <div className="p-4">
                                    <SearchField mobile />
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Suspense fallback={<Loader className='size-5 animate-spin text-white m-auto' />}>
                        <Link href={'/cart'} className="relative cursor-pointer">
                            <Avatar className='h-8 w-8'>
                                <AvatarImage src="/icons/shopping-cart.svg" alt="Cart" />
                                <AvatarFallback>
                                    <ShoppingCart className='h-4 w-4' />
                                </AvatarFallback>
                            </Avatar>
                            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center">
                                {cart.totalItems}
                            </Badge>
                        </Link>
                    </Suspense>

                    <AccountDropdown
                        isAuthenticated={isAuthenticated}
                        isPhysicalStoreOwner={isPhysicalStoreOwner}
                        isVirtualStoreOwner={isVirtualStoreOwner}
                        isSystemAdmin={isSystemAdmin}
                    />
                </div>
            </div>

            <div className='main-container hidden md:flex justify-between bg-primary font-sans flex-between text-white font-medium border-b border-blue-50/20 h-14'>
                <div className='flex gap-6 items-center'>
                    <AllCategories />
                    <Link href={'/'} className='hover:text-white/80'>Top Deals</Link>
                    <Link href={'/'} className='hover:text-white/80'>Deal of the day</Link>
                    <Link href={'/'} className='hover:text-white/80'>Men</Link>
                    <Link href={'/'} className='hover:text-white/80'>Women</Link>
                </div>
                <div className='flex gap-6 items-center'>
                    <NavigationMenuCategories />
                    <Link href={'/sell'} className='hover:text-white/80'>Start selling</Link>
                    <Link href={'/explore-stores'} className='hover:text-white/80'>Explore</Link>
                </div>
            </div>
        </>
    );
}