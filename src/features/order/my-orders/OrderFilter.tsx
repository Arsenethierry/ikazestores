"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    // SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { OrderStatus, PaymentStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    CalendarIcon,
    Filter,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface OrderFilterProps {
    currentStatus?: OrderStatus | "all";
    showAdvanced?: boolean;
}

export function OrderFilter({
    currentStatus,
    showAdvanced = false,
}: OrderFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get("search") || ""
    );
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: searchParams.get("dateFrom")
            ? new Date(searchParams.get("dateFrom")!)
            : undefined,
        to: searchParams.get("dateTo")
            ? new Date(searchParams.get("dateTo")!)
            : undefined,
    });
    const [priceRange, setPriceRange] = useState<[number, number]>([
        Number(searchParams.get("minPrice")) || 0,
        Number(searchParams.get("maxPrice")) || 10000,
    ]);
    const [paymentStatus, setPaymentStatus] = useState(
        searchParams.get("paymentStatus") || ""
    );

    const handleSearch = useCallback(() => {
        const params = new URLSearchParams(searchParams);

        // Search query
        if (searchQuery) {
            params.set("search", searchQuery);
        } else {
            params.delete("search");
        }

        // Status filter
        if (currentStatus && currentStatus !== "all") {
            params.set("status", currentStatus);
        } else {
            params.delete("status");
        }

        // Date range
        if (dateRange.from) {
            params.set("dateFrom", dateRange.from.toISOString());
        } else {
            params.delete("dateFrom");
        }
        if (dateRange.to) {
            params.set("dateTo", dateRange.to.toISOString());
        } else {
            params.delete("dateTo");
        }

        // Price range
        if (priceRange[0] > 0) {
            params.set("minPrice", priceRange[0].toString());
        } else {
            params.delete("minPrice");
        }
        if (priceRange[1] < 10000) {
            params.set("maxPrice", priceRange[1].toString());
        } else {
            params.delete("maxPrice");
        }

        // Payment status
        if (paymentStatus) {
            params.set("paymentStatus", paymentStatus);
        } else {
            params.delete("paymentStatus");
        }

        // Reset to page 1
        params.set("page", "1");

        router.push(`?${params.toString()}`);
    }, [
        searchQuery,
        currentStatus,
        dateRange,
        priceRange,
        paymentStatus,
        router,
        searchParams,
    ]);

    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setDateRange({ from: undefined, to: undefined });
        setPriceRange([0, 10000]);
        setPaymentStatus("");
        router.push("/my-orders");
    }, [router]);

    const hasActiveFilters =
        searchQuery ||
        currentStatus ||
        dateRange.from ||
        dateRange.to ||
        priceRange[0] > 0 ||
        priceRange[1] < 10000 ||
        paymentStatus;

    const activeFilterCount = [
        searchQuery,
        currentStatus,
        dateRange.from,
        priceRange[0] > 0 || priceRange[1] < 10000,
        paymentStatus,
    ].filter(Boolean).length;

    return (
        <Card className="p-4">
            <div className="space-y-4">
                {/* Basic Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by order number, product, or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={handleSearch} size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Advanced Filters */}
                {isAdvancedOpen && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label>Order Status</Label>
                            <Select
                                value={currentStatus || "all"}
                                onValueChange={(value) =>
                                    handleSearch()
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {Object.values(OrderStatus).map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Status Filter */}
                        <div className="space-y-2">
                            <Label>Payment Status</Label>
                            <Select
                                value={paymentStatus}
                                onValueChange={setPaymentStatus}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Payments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payments</SelectItem>
                                    {Object.values(PaymentStatus).map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label>Order Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateRange.from && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "PPP")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange.from}
                                        selected={{
                                            from: dateRange.from,
                                            to: dateRange.to,
                                        }}
                                        onSelect={(range) =>
                                            setDateRange({
                                                from: range?.from,
                                                to: range?.to,
                                            })
                                        }
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Price Range */}
                        <div className="space-y-2">
                            <Label>
                                Price Range: {priceRange[0]} - {priceRange[1]} RWF
                            </Label>
                            <Slider
                                min={0}
                                max={10000}
                                step={100}
                                value={priceRange}
                                onValueChange={(value) =>
                                    setPriceRange(value as [number, number])
                                }
                                className="mt-2"
                            />
                        </div>
                    </div>
                )}

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                        <span className="text-sm text-muted-foreground">
                            Active filters ({activeFilterCount}):
                        </span>
                        {searchQuery && (
                            <Badge variant="secondary">
                                Search: {searchQuery}
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        handleSearch();
                                    }}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {currentStatus && currentStatus !== "all" && (
                            <Badge variant="secondary">
                                Status: {currentStatus}
                                <button
                                    onClick={() => {
                                        const params = new URLSearchParams(searchParams);
                                        params.delete("status");
                                        router.push(`?${params.toString()}`);
                                    }}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {dateRange.from && (
                            <Badge variant="secondary">
                                Date: {format(dateRange.from, "MMM dd")}
                                {dateRange.to && ` - ${format(dateRange.to, "MMM dd")}`}
                                <button
                                    onClick={() => {
                                        setDateRange({ from: undefined, to: undefined });
                                        handleSearch();
                                    }}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                            <Badge variant="secondary">
                                Price: {priceRange[0]}-{priceRange[1]} RWF
                                <button
                                    onClick={() => {
                                        setPriceRange([0, 10000]);
                                        handleSearch();
                                    }}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {paymentStatus && (
                            <Badge variant="secondary">
                                Payment: {paymentStatus}
                                <button
                                    onClick={() => {
                                        setPaymentStatus("");
                                        handleSearch();
                                    }}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}