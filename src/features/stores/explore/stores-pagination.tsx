"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

interface StoresPaginationProps {
    currentPage: number;
    totalPages: number;
    totalResults: number;
}

export function StoresPagination({ currentPage, totalPages, totalResults }: StoresPaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const navigateToPage = (page: number) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", page.toString());
            router.push(`${pathname}?${params.toString()}`, { scroll: true });
        });
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col items-center gap-4 py-8">
            <div className="text-sm text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({totalResults} stores)
            </div>

            <div className="flex items-center gap-2">
                {/* First Page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateToPage(1)}
                    disabled={currentPage === 1 || isPending}
                    className="h-9 w-9"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous Page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage === 1 || isPending}
                    className="h-9 w-9"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-2">
                    {getPageNumbers().map((page, index) => {
                        if (page === "...") {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                                    ...
                                </span>
                            );
                        }

                        return (
                            <Button
                                key={page}
                                variant={currentPage === page ? "teritary" : "outline"}
                                size="sm"
                                onClick={() => navigateToPage(page as number)}
                                disabled={isPending}
                                className="h-9 w-9"
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                <div className="sm:hidden">
                    <Button variant="outline" size="sm" disabled className="h-9 px-4">
                        {currentPage} / {totalPages}
                    </Button>
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isPending}
                    className="h-9 w-9"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateToPage(totalPages)}
                    disabled={currentPage === totalPages || isPending}
                    className="h-9 w-9"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}