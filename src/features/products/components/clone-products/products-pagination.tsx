'use client';

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface ProductsPaginationProps {
    currentPage: number;
    hasMore: boolean;
    total: number;
}

export function ProductsPagination({ currentPage, hasMore, total }: ProductsPaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(newPage));

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    if (total === 0) return null;

    return (
        <div className="flex justify-center items-center gap-4 mt-8">
            <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
            </Button>

            <span className="text-sm text-muted-foreground">
                Page {currentPage}
            </span>

            <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMore || isPending}
            >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
}