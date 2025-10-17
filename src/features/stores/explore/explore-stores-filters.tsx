"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ExploreStoresFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

    const handleFilterChange = (key: string, value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (value && value !== "all") {
                params.set(key, value);
            } else {
                params.delete(key);
            }

            params.delete("page");

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (searchInput.trim()) {
                params.set("search", searchInput.trim());
            } else {
                params.delete("search");
            }

            params.delete("page");
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        });
    };

    const clearFilters = () => {
        startTransition(() => {
            setSearchInput("");
            router.push(pathname, { scroll: false });
        });
    };

    const hasActiveFilters = searchParams.toString().length > 0;

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search stores by name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10"
                                disabled={isPending}
                            />
                        </div>
                        <Button type="submit" disabled={isPending}>
                            Search
                        </Button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Minimum Rating</Label>
                            <Select
                                value={searchParams.get("rating") || "all"}
                                onValueChange={(value) => handleFilterChange("rating", value)}
                                disabled={isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Ratings" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Ratings</SelectItem>
                                    <SelectItem value="5">5 Stars</SelectItem>
                                    <SelectItem value="4">4+ Stars</SelectItem>
                                    <SelectItem value="3">3+ Stars</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Sort By</Label>
                            <Select
                                value={searchParams.get("sortBy") || "newest"}
                                onValueChange={(value) => handleFilterChange("sortBy", value)}
                                disabled={isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="popular">Most Popular</SelectItem>
                                    <SelectItem value="rating">Highest Rated</SelectItem>
                                    <SelectItem value="name">Name (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium opacity-0">Action</Label>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters || isPending}
                                className="w-full"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Filters active</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function ExploreStoresFiltersSkeleton() {
    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}