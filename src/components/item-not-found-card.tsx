"use client";

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from './ui/button';

interface ItemNotFoundCardProps {
    itemName?: string;
    message?: string;
    backUrl?: string;
    showBackButton?: boolean;
    showHomeButton?: boolean;
}

export const ItemNotFoundCard = ({
    itemName = 'Item',
    message = '',
    backUrl,
    showBackButton = true,
    showHomeButton = true
}: ItemNotFoundCardProps) => {
    const router = useRouter();

    const handleBack = () => {
        if (backUrl) {
            router.push(backUrl);
        } else {
            router.back();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-r from-gray-50 to-gray-100 p-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-600 mb-4 animate-bounce">📦</h1>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">{itemName} Not Found</h2>
                <p className="text-xl text-gray-600 mb-4">
                    The {itemName.toLowerCase()} you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                {message && (
                    <p className="text-lg text-secondary-foreground mb-8">
                        {message}
                    </p>
                )}
                <div className='flex gap-2 flex-col md:flex-row mx-auto justify-center'>
                    {showBackButton && (
                        <Button variant={'outline'} onClick={handleBack}>
                            Go Back
                        </Button>
                    )}
                    {showHomeButton && (
                        <Button variant={'secondary'} onClick={() => router.push("/")}>
                            Go Home
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};