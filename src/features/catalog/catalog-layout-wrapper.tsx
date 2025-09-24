'use client';

import { memo } from "react";
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CatalogErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const CatalogErrorFallback = memo<CatalogErrorFallbackProps>(({ error, resetErrorBoundary }) => (
    <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
            <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        There was an error loading the catalog component.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-4 text-left">
                            <summary className="cursor-pointer text-sm text-gray-600">
                                Error details
                            </summary>
                            <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                                {error.message}
                            </pre>
                        </details>
                    )}
                </div>
                <Button onClick={resetErrorBoundary} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try again
                </Button>
            </div>
        </CardContent>
    </Card>
))

CatalogErrorFallback.displayName = 'CatalogErrorFallback';

interface CatalogLayoutWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function CatalogLayoutWrapper({ children, fallback }: CatalogLayoutWrapperProps) {
    return (
        <ErrorBoundary
            FallbackComponent={CatalogErrorFallback}
            onReset={() => {
                // Optionally clear any cached data or reset state
                window.location.reload();
            }}
        >
            <Suspense fallback={fallback}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}
