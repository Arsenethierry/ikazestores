"use client";

import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

export function OrderPagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    const searchParams = useSearchParams();

    const createPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        return `${baseUrl}?${params.toString()}`;
    };

    const pageNumbers = useMemo(() => {
        const delta = 2;
        const range: (number | string)[] = [];
        const rangeWithDots: (number | string)[] = [];
        let l: number | undefined;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (typeof i === "number" && i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (typeof i === "number" && i - l !== 1) {
                    rangeWithDots.push("...");
                }
            }
            rangeWithDots.push(i);
            l = typeof i === "number" ? i : undefined;
        });

        return rangeWithDots;
    }, [currentPage, totalPages]);

    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav className="flex items-center justify-center">
            <div className="flex items-center gap-1">
                {/* First page button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={currentPage === 1}
                    asChild={currentPage !== 1}
                >
                    {currentPage === 1 ? (
                        <div>
                            <ChevronsLeft className="h-4 w-4" />
                            <span className="sr-only">First page</span>
                        </div>
                    ) : (
                        <Link href={createPageUrl(1)}>
                            <ChevronsLeft className="h-4 w-4" />
                            <span className="sr-only">First page</span>
                        </Link>
                    )}
                </Button>

                {/* Previous page button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={currentPage === 1}
                    asChild={currentPage !== 1}
                >
                    {currentPage === 1 ? (
                        <div>
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous page</span>
                        </div>
                    ) : (
                        <Link href={createPageUrl(currentPage - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous page</span>
                        </Link>
                    )}
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === "...") {
                            return (
                                <div
                                    key={`dots-${index}`}
                                    className="flex h-9 w-9 items-center justify-center"
                                >
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </div>
                            );
                        }

                        const pageNumber = page as number;
                        const isActive = pageNumber === currentPage;

                        return (
                            <Button
                                key={pageNumber}
                                variant={isActive ? "secondary" : "outline"}
                                size="icon"
                                className="h-9 w-9"
                                asChild={!isActive}
                            >
                                {isActive ? (
                                    <div>
                                        <span>{pageNumber}</span>
                                        <span className="sr-only">
                                            Page {pageNumber} (current)
                                        </span>
                                    </div>
                                ) : (
                                    <Link href={createPageUrl(pageNumber)}>
                                        <span>{pageNumber}</span>
                                        <span className="sr-only">
                                            Go to page {pageNumber}
                                        </span>
                                    </Link>
                                )}
                            </Button>
                        );
                    })}
                </div>

                {/* Next page button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={currentPage === totalPages}
                    asChild={currentPage !== totalPages}
                >
                    {currentPage === totalPages ? (
                        <div>
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next page</span>
                        </div>
                    ) : (
                        <Link href={createPageUrl(currentPage + 1)}>
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next page</span>
                        </Link>
                    )}
                </Button>

                {/* Last page button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={currentPage === totalPages}
                    asChild={currentPage !== totalPages}
                >
                    {currentPage === totalPages ? (
                        <div>
                            <ChevronsRight className="h-4 w-4" />
                            <span className="sr-only">Last page</span>
                        </div>
                    ) : (
                        <Link href={createPageUrl(totalPages)}>
                            <ChevronsRight className="h-4 w-4" />
                            <span className="sr-only">Last page</span>
                        </Link>
                    )}
                </Button>
            </div>
        </nav>
    );
}