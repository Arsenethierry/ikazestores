'use client'

import { Button } from '@/components/ui/button';
import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Modern Template] Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Something went wrong!</h2>
                <p className="text-muted-foreground">
                    We encountered an error loading the page.
                </p>
                <Button onClick={reset}>Try again</Button>
            </div>
        </div>
    );
}