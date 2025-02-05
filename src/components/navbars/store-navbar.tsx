import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CircleUser, Heart, ShoppingCart } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { NavigationMenuCategories } from '@/components/navbars/navigation-menu';

function StoreNavbar() {
    const tags = [
        {
            name: 'fashions',
        },
        {
            name: 'electronic',
        },
        {
            name: 'furniture',
        },
        {
            name: 'Accessories',
        },
        {
            name: 'shoes',
        },
        {
            name: 'smartphone',
        },
        {
            name: 'cellphone',
        },
        {
            name: 'cameras',
        },
        {
            name: 'laptops',
        },
    ]
    return (
        <>
            <section className='main-container min-h-10 flex justify-between items-center bg-[#f5f5f5]'>
                <div className='text-sm'>
                    <b>Welcome to Emarket ! </b>
                    <span className='text-gray-600'>Wrap new offers / gift every single day on Weekends - New Coupon code: Happy2017</span>
                </div>
            </section>
            <div className='sticky top-0 z-50 bg-white'>
                <section className='flex py-2 main-container border-b'>
                    <div className='flex-none w-max'>
                        <NavigationMenuCategories />
                    </div>
                    <div className='grow px-10'>
                    </div>
                    <div className='flex-none w-max'>
                        <div className='flex gap-3 items-center'>
                            <Link
                                href={'/my-cart'}
                                className={'text-black gap-1 font-bold inline-flex'}
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
                                className={'text-black gap-1 font-bold inline-flex'}
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
                                    <Button variant={'ghost'} className='text-black font-medium cursor-pointer inline-flex w-max'>
                                        <CircleUser className='h-4 m-auto' />
                                        <span>My account</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </section>
                <section className='main-container min-h-7 flex items-center gap-2 bg-[#f5f5f5] border-b-2 shadow-xl'>
                    <b>Top tags:</b>
                    {tags.map(tag => <Link href={`?tag=${tag.name.toLowerCase()}`} key={tag.name} className='text-sm capitalize text-gray-500 hover:text-primary hover:underline'>{tag.name}</Link>)}
                </section>
            </div>
        </>
    );
}

export default StoreNavbar;