"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
}

export const PaginationComponent = ({ totalPages, currentPage }: PaginationProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        pages.push(1);

        if (currentPage > 3) {
            pages.push("...");
        }

        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            if (i > 1 && i < totalPages) {
                pages.push(i);
            }
        }

        if (currentPage < totalPages - 2) {
            pages.push("...");
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center space-x-2 py-4">
            <Button
                variant="outline"
                size="icon"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
            >
                {currentPage > 1 ? (
                    <Link href={createPageURL(currentPage - 1)} aria-label="Previous page">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronLeft className="h-4 w-4" />
                    </span>
                )}
            </Button>

            <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, i) => {
                    if (page === "...") {
                        return (
                            <Button key={`ellipsis-${i}`} variant="outline" size="icon" disabled>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        );
                    }

                    const isCurrentPage = page === currentPage;
                    return (
                        <Button
                            key={`page-${page}`}
                            variant={isCurrentPage ? "teritary" : "outline"}
                            size="icon"
                            aria-current={isCurrentPage ? "page" : undefined}
                            asChild={!isCurrentPage}
                        >
                            {!isCurrentPage ? (
                                <Link href={createPageURL(page)} aria-label={`Go to page ${page}`}>
                                    {page}
                                </Link>
                            ) : (
                                <span>{page}</span>
                            )}
                        </Button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={createPageURL(currentPage + 1)} aria-label="Next page">
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronRight className="h-4 w-4" />
                    </span>
                )}
            </Button>
        </div>
    );
};