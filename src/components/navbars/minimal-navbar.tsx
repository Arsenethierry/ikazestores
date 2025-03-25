import Link from 'next/link';
import React from 'react';

export default function MinimalNavbar() {
    return (
        <>
            <section className='main-container min-h-14 flex justify-between items-center bg-primary'>
                <Link href={'/'} className='font-bold text-26 text-white'>
                    Ikaze<span className='text-yellow-400'>Stores</span>
                </Link>
            </section>
        </>
    );
}