"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { OrderStatus } from "@/lib/constants";
import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface OrderFiltersProps {
    currentStatus?: OrderStatus;
}

export function OrderFilters({ currentStatus }: OrderFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleStatusChange = useCallback((value: string) => {
        const params = new URLSearchParams(searchParams);
        
        if (value === "all") {
            params.delete("status");
        } else {
            params.set("status", value);
        }
        
        // Reset to page 1 when filter changes
        params.set("page", "1");
        
        router.push(`?${params.toString()}`);
    }, [router, searchParams]);

    const clearFilters = useCallback(() => {
        router.push("/my-orders");
    }, [router]);

    const getStatusLabel = (status: OrderStatus) => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return "secondary";
            case OrderStatus.PROCESSING:
                return "default";
            case OrderStatus.SHIPPED:
                return "outline";
            case OrderStatus.DELIVERED:
                return "default";
            case OrderStatus.CANCELLED:
                return "destructive";
            default:
                return "secondary";
        }
    };

    const hasActiveFilters = currentStatus !== undefined;

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="flex items-center gap-3">
                    <Select
                        value={currentStatus || "all"}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Orders" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            {Object.values(OrderStatus).map((status) => (
                                <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={getStatusColor(status)}
                                            className="h-2 w-2 p-0 rounded-full"
                                        />
                                        {getStatusLabel(status)}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-9 px-2"
                        >
                            <X className="h-4 w-4" />
                            <span className="ml-1">Clear</span>
                        </Button>
                    )}
                </div>
            </div>

            {currentStatus && (
                <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Active filter:</span>
                        <Badge variant={getStatusColor(currentStatus)}>
                            {getStatusLabel(currentStatus)}
                        </Badge>
                    </div>
                </div>
            )}
        </Card>
    );
}