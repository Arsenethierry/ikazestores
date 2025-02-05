import Link from 'next/link';
import React from 'react';

function SectionOne() {
    return (
        <div className='main-container bg-primary font-sans text-white font-medium flex-between border-b border-blue-50/20 h-8'>
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
    );
}

export default SectionOne;