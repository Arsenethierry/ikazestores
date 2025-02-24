import Link from 'next/link';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CircleUser, Heart, LayoutDashboard, Settings, ShoppingCart, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { AllCategories } from './all-categories';
import { NavigationMenuCategories } from './navigation-menu';
import LogoutButton from '@/features/auth/components/logout-button';
import { getAuthState } from '@/lib/user-label-permission';

export default async function MarketplaceNavbar() {
    const {
        isSystemAdmin,
        isAuthenticated,
        isVirtualStoreOwner,
        isPhysicalStoreOwner
    } = await getAuthState();

    return (
        <>
            <div className='main-container flex justify-between items-center bg-primary font-sans text-white font-medium flex-between border-b border-blue-50/20 h-8'>
                <div className='flex gap-3'>
                    <Link href={'/'}>Language: English</Link>
                    <Link href={'/'}>currency</Link>
                </div>
                <div className='flex gap-3'>
                    <Link href={'/'}>About Us</Link>
                    <Link href={'/'}>Contact Us</Link>
                    <Link href={'/'}>FAQs</Link>
                </div>
            </div>
            <div className='main-container flex justify-between items-center z-50 font-sans flex-between h-16 sticky top-0 bg-primary'>
                <div className='flex gap-3 w-full'>
                    <Link href={'/'} className='font-bold text-26 text-white'>
                        Ikaze<span className='text-yellow-400'>Online</span>
                    </Link>

                    <Input
                        placeholder='search products...'
                        className='bg-white max-w-lg mr-5'
                    />
                </div>
                <div className='flex gap-3 items-center'>
                    <Link
                        href={'/my-cart'}
                        className={'text-white gap-1 font-bold inline-flex'}
                    >
                        <Avatar className='h-max w-max'>
                            <AvatarImage src="/icons/shopping-cart.svg" width={24} />
                            <AvatarFallback>
                                <ShoppingCart />
                            </AvatarFallback>
                        </Avatar>
                        <span className='hidden lg:block'>Cart</span>
                    </Link>
                    <Link
                        href={'/my-cart'}
                        className={'text-white gap-1 font-bold inline-flex'}
                    >
                        <Avatar className='h-max w-max'>
                            <AvatarImage sizes='4' width={22} src="/icons/heart.svg" />
                            <AvatarFallback>
                                <Heart />
                            </AvatarFallback>
                        </Avatar>
                        <span className='hidden lg:block'>Favorite</span>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            {isAuthenticated ? (
                                <Button variant={'ghost'} className='text-white font-medium cursor-pointer inline-flex w-max'>
                                    <CircleUser className='h-4 m-auto' />
                                    <span>My account</span>
                                </Button>
                            ) : (
                                <Button variant={'ghost'} className='text-white cursor-pointer inline-flex w-max'>
                                    <CircleUser />
                                    <div className='flex flex-col text-xs items-start'>
                                        <span>My account</span>
                                        <span className='font-extralight text-xs'>Login / Register</span>
                                    </div>
                                </Button>
                            )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <>
                                    {isAuthenticated ? <>
                                        <DropdownMenuItem>
                                            <User />
                                            <span>Profile</span>
                                            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Settings />
                                            <span>Settings</span>
                                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                        {(isPhysicalStoreOwner || isVirtualStoreOwner) && (
                                            <DropdownMenuItem className='cursor-pointer w-full'>
                                                <Link href={'/admin'} className='w-full font-medium cursor-pointer inline-flex'>
                                                    <LayoutDashboard className='h-4 my-auto' />
                                                    <span>Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem>
                                            <LogoutButton />
                                        </DropdownMenuItem>
                                    </> : <>
                                        <DropdownMenuItem className='cursor-pointer w-full'>
                                            <Link href={'/sign-in'} className='w-full font-medium cursor-pointer inline-flex'>
                                                <CircleUser className='h-4 my-auto' />
                                                <span>Log In</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className='cursor-pointer w-full'>
                                            <Link href={'/sign-up'} className='w-full font-medium cursor-pointer inline-flex justify-items-start'>
                                                <CircleUser className='h-4 my-auto' />
                                                <span>Create account</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </>}
                                </>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {isSystemAdmin && (
                        <Link href={'/admin'} className='hover:underline w-max text-white hover:text-white/80'>Admin</Link>
                    )}
                </div>
            </div>

            <div className='main-container flex justify-between bg-primary font-sans flex-between text-white font-medium border-b border-blue-50/20 h-14'>
                <div className='flex gap-3 items-center'>
                    <AllCategories />
                    <Link href={'/'}>Top Deals</Link>
                    <Link href={'/'}>Deal of the day</Link>
                    <Link href={'/'}>Men</Link>
                    <Link href={'/'}>Women</Link>
                </div>
                <div className='flex gap-3 items-center'>
                    <NavigationMenuCategories />
                    <Link href={'/sell'} target='_blank' className='hover:underline hover:text-white/80'>Start selling</Link>
                    <Link href={'/explore-stores'} className='hover:underline hover:text-white/80'>Explore</Link>
                </div>
            </div>
        </>
    );
}