"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "@/lib/constants";
import { format } from "date-fns";
import { CalendarIcon, Filter, RotateCcw, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

interface OrdersFiltersProps {
    storeType: 'virtual' | 'physical';
    permissions: {
        canUpdateStatus: boolean;
        canUpdateFulfillment: boolean;
        canCancel: boolean;
        canBulkUpdate: boolean;
        canViewAll: boolean;
    };
    searchParams: { [key: string]: string | string[] | undefined };
}

export function OrdersFilters({ storeType, permissions, searchParams: initialSearchParams }: OrdersFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const getInitialFilters = () => {
        const status = searchParams.get('status')?.split(',') || [];
        const fulfillmentStatus = searchParams.get('fulfillmentStatus')?.split(',') || [];
        const search = searchParams.get('search') || '';
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        return {
            status,
            fulfillmentStatus,
            search,
            dateRange: dateFrom && dateTo ? {
                from: new Date(dateFrom),
                to: new Date(dateTo)
            } : undefined
        };
    };

    const initialFilters = getInitialFilters();

    const [searchTerm, setSearchTerm] = useState(initialFilters.search);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(initialFilters.dateRange);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialFilters.status);
    const [selectedFulfillmentStatuses, setSelectedFulfillmentStatuses] = useState<string[]>(initialFilters.fulfillmentStatus);

    const createQueryString = useCallback(
        (params: Record<string, string | undefined>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    newSearchParams.set(key, value);
                } else {
                    newSearchParams.delete(key);
                }
            });

            // Reset to page 1 when filters change
            newSearchParams.set('page', '1');

            return newSearchParams.toString();
        },
        [searchParams]
    );

    const applyFilters = useCallback((updates: Record<string, string | undefined>) => {
        router.push(`${pathname}?${createQueryString(updates)}`);
    }, [router, pathname, createQueryString]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        // Debounce search
        const timeoutId = setTimeout(() => {
            applyFilters({ search: value });
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handleStatusFilter = (status: OrderStatus, checked: boolean) => {
        const updated = checked
            ? [...selectedStatuses, status]
            : selectedStatuses.filter(s => s !== status);

        setSelectedStatuses(updated);
        applyFilters({ status: updated.length > 0 ? updated.join(',') : undefined });
    };

    const handleFulfillmentFilter = (status: PhysicalStoreFulfillmentOrderStatus, checked: boolean) => {
        const updated = checked
            ? [...selectedFulfillmentStatuses, status]
            : selectedFulfillmentStatuses.filter(s => s !== status);

        setSelectedFulfillmentStatuses(updated);
        applyFilters({ fulfillmentStatus: updated.length > 0 ? updated.join(',') : undefined });
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        if (range?.from && range?.to) {
            applyFilters({
                dateFrom: range.from.toISOString(),
                dateTo: range.to.toISOString()
            });
        } else {
            applyFilters({ dateFrom: undefined, dateTo: undefined });
        }
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setDateRange(undefined);
        setSelectedStatuses([]);
        setSelectedFulfillmentStatuses([]);
        router.push(pathname);
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (selectedStatuses.length > 0) count++;
        if (selectedFulfillmentStatuses.length > 0) count++;
        if (dateRange) count++;
        if (searchTerm) count++;
        return count;
    };

    const activeFiltersCount = getActiveFiltersCount();

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </CardTitle>
                    {activeFiltersCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="search">Search Orders</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search"
                            placeholder="Search by order number, customer email..."
                            value={searchTerm}
                            onChange={(e: any) => handleSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Order Status</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    size="sm"
                                >
                                    Status
                                    {selectedStatuses.length > 0 && (
                                        <Badge variant="secondary" className="ml-auto">
                                            {selectedStatuses.length}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60" align="start">
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Select Statuses</h4>
                                    <div className="space-y-2">
                                        {Object.values(OrderStatus).map((status) => (
                                            <div key={status} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={status}
                                                    checked={selectedStatuses.includes(status)}
                                                    onCheckedChange={(checked) =>
                                                        handleStatusFilter(status, !!checked)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={status}
                                                    className="text-sm capitalize cursor-pointer"
                                                >
                                                    {status}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {storeType === 'physical' && (
                        <div className="space-y-2">
                            <Label>Fulfillment Status</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        size="sm"
                                    >
                                        Fulfillment
                                        {selectedFulfillmentStatuses.length > 0 && (
                                            <Badge variant="secondary" className="ml-auto">
                                                {selectedFulfillmentStatuses.length}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-60" align="start">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm">Select Fulfillment Status</h4>
                                        <div className="space-y-2">
                                            {Object.values(PhysicalStoreFulfillmentOrderStatus).map((status) => (
                                                <div key={status} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`fulfillment-${status}`}
                                                        checked={selectedFulfillmentStatuses.includes(status)}
                                                        onCheckedChange={(checked) =>
                                                            handleFulfillmentFilter(status, !!checked)
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`fulfillment-${status}`}
                                                        className="text-sm capitalize cursor-pointer"
                                                    >
                                                        {status.replace('_', ' ')}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                    size="sm"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "MMM dd")} -{" "}
                                                {format(dateRange.to, "MMM dd")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "MMM dd, yyyy")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={handleDateRangeChange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Quick Filters</Label>
                        <div className="flex flex-wrap gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedStatuses([OrderStatus.PENDING]);
                                    applyFilters({ status: OrderStatus.PENDING });
                                }}
                                className="text-xs h-7"
                            >
                                Pending
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                                    handleDateRangeChange({ from: weekAgo, to: today });
                                }}
                                className="text-xs h-7"
                            >
                                This Week
                            </Button>
                        </div>
                    </div>
                </div>

                {activeFiltersCount > 0 && (
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Active Filters</Label>
                        <div className="flex flex-wrap gap-1">
                            {selectedStatuses.map((status) => (
                                <Badge
                                    key={status}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    Status: {status}
                                    <button
                                        onClick={() => handleStatusFilter(status as OrderStatus, false)}
                                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}

                            {selectedFulfillmentStatuses.map((status) => (
                                <Badge
                                    key={status}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    Fulfillment: {status.replace('_', ' ')}
                                    <button
                                        onClick={() => handleFulfillmentFilter(status as PhysicalStoreFulfillmentOrderStatus, false)}
                                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}

                            {dateRange && (
                                <Badge variant="secondary" className="text-xs">
                                    {format(dateRange.from!, "MMM dd")} - {format(dateRange.to!, "MMM dd")}
                                    <button
                                        onClick={() => handleDateRangeChange(undefined)}
                                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}

                            {searchTerm && (
                                <Badge variant="secondary" className="text-xs">
                                    Search: "{searchTerm}"
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            applyFilters({ search: undefined });
                                        }}
                                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}