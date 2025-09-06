"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatus } from "@/lib/constants";
import { BarChart3, DollarSign, Package, RefreshCw, ShoppingCart } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface OrdersStatsClientProps {
    stats: any;
    storeId: string;
    storeType: 'virtual' | 'physical' | undefined;
    initialTimeRange: string;
}

export function OrdersStatsClient({
    stats,
    storeId,
    storeType,
    initialTimeRange
}: OrdersStatsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [timeRange, setTimeRange] = useState(initialTimeRange);

    const handleTimeRangeChange = (newTimeRange: string) => {
        setTimeRange(newTimeRange);
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('timeRange', newTimeRange);
        router.push(`${pathname}?${newSearchParams.toString()}`);
    };

    const handleRefresh = () => {
        router.refresh();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    const conversionRate = stats.totalOrders > 0
        ? ((stats.statusBreakdown[OrderStatus.DELIVERED] || 0) / stats.totalOrders * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">
                        Order insights and performance metrics
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            From {stats.totalOrders} orders
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Per transaction
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Delivered orders
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(stats.statusBreakdown[OrderStatus.PENDING] || 0) +
                                (stats.statusBreakdown[OrderStatus.PROCESSING] || 0) +
                                (stats.statusBreakdown[OrderStatus.SHIPPED] || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            In progress
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <CardDescription>
                        Breakdown of orders by current status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                            const percentage = stats.totalOrders > 0
                                ? ((count as number) / stats.totalOrders * 100).toFixed(1)
                                : '0';

                            return (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Badge variant={getStatusVariant(status)} className="capitalize">
                                            {status}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {count as number} orders
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-32 bg-secondary rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getStatusColor(status)}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-12 text-right">
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status.toLowerCase()) {
        case 'pending': return "secondary";
        case 'processing': return "default";
        case 'shipped': return "outline";
        case 'delivered': return "default";
        case 'cancelled': return "destructive";
        default: return "secondary";
    }
}

function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'pending': return "bg-yellow-500";
        case 'processing': return "bg-blue-500";
        case 'shipped': return "bg-purple-500";
        case 'delivered': return "bg-green-500";
        case 'cancelled': return "bg-red-500";
        default: return "bg-gray-500";
    }
}