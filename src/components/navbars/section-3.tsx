import React from 'react';
import { AllCategories } from './all-categories';
import Link from 'next/link';
import { NavigationMenuCategories } from './navigation-menu';

function SectionThree() {
    return (
        <div className='main-container bg-primary font-sans flex-between text-white font-medium border-b border-blue-50/20 h-14'>
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
                <Link href={'/explore-stores'} target='_blank' className='hover:underline hover:text-white/80'>Explore</Link>
            </div>
        </div>
    );
}

export default SectionThree;