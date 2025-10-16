"use client";

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface SubscribersPaginationProps {
    currentPage: number;
    totalPages: number;
}

export function SubscribersPagination({
    currentPage,
    totalPages
}: SubscribersPaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const navigateToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // First page
        if (startPage > 1) {
            pages.push(
                <Button
                    key={1}
                    variant={1 === currentPage ? "teritary" : "outline"}
                    size="sm"
                    onClick={() => navigateToPage(1)}
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="start-ellipsis" className="px-2">...</span>
                );
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={i === currentPage ? "teritary" : "outline"}
                    size="sm"
                    onClick={() => navigateToPage(i)}
                >
                    {i}
                </Button>
            );
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <span key="end-ellipsis" className="px-2">...</span>
                );
            }
            pages.push(
                <Button
                    key={totalPages}
                    variant={totalPages === currentPage ? "teritary" : "outline"}
                    size="sm"
                    onClick={() => navigateToPage(totalPages)}
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                    {renderPageNumbers()}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}