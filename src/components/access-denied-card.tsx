"use client";

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from './ui/button';

export const AccessDeniedCard = ({ message = '' }: { message?: string }) => {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-r from-red-50 to-red-100 p-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-red-600 mb-4 animate-bounce">🚫</h1>
                <h2 className="text-4xl font-bold text-red-800 mb-2">Access Denied</h2>
                <p className="text-xl text-red-600 mb-8">
                    You do not have permission to view this page.
                </p>
                <p className="text-xl text-secondary-foreground mb-8">
                    {message}
                </p>
                <div className='flex gap-2 flex-col md:flex-row mx-auto justify-center'>
                    <Button variant={'outline'} onClick={() => router.back()}>
                        Go Back
                    </Button>
                    <Button variant={'teritary'} onClick={() => router.push("/")}>
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}