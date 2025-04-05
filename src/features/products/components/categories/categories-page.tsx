import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import React from 'react';

export const AllCategories = () => {
    return (
        <div className='w-full max-w-7xl space-y-5'>
            <nav className='flex justify-between'>
                <h3>All Categories</h3>
                <Link href={'/admin/categories/new'} className={buttonVariants()}>Create new category</Link>
            </nav>

            <Card>
                <CardContent>
                    
                </CardContent>
            </Card>
        </div>
    );
}