import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette } from 'lucide-react';
import { VariantTemplatesOptionsContent } from './VariantTemplatesOptionsContent';

interface VariantTemplatesOptionsSectionProps {
    productTypeId: string;
}

function VariantTemplatesOptionsLoading() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Variant Templates & Options
                </CardTitle>
                <CardDescription>
                    Loading variant templates and their options...
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <div className="flex space-x-2">
                                            <Skeleton className="h-5 w-16" />
                                            <Skeleton className="h-5 w-20" />
                                            <Skeleton className="h-5 w-12" />
                                        </div>
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-6" />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, optionIndex) => (
                                    <Skeleton key={optionIndex} className="h-16 rounded-lg" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function VariantTemplatesOptionsSection({ productTypeId }: VariantTemplatesOptionsSectionProps) {
    return (
        <Suspense fallback={<VariantTemplatesOptionsLoading />}>
            <VariantTemplatesOptionsContent productTypeId={productTypeId} />
        </Suspense>
    );
}