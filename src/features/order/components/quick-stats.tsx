import { Card, CardContent } from "@/components/ui/card";
import { getOrderStatsAction } from "@/lib/actions/product-order-actions";
import { OrderStatus } from "@/lib/constants";
import { AlertCircle, CheckCircle, Clock, Package, ShoppingCart, TrendingUp } from "lucide-react";

interface QuickStatsProps {
    storeId: string;
    storeType: 'virtual' | 'physical' | undefined;
    dateRange?: {
        from: Date;
        to: Date;
    };
}

export async function QuickStats({ storeId, storeType, dateRange }: QuickStatsProps) {
    const statsResult = await getOrderStatsAction({
        storeId,
        storeType,
        dateRange
    });

    if (!statsResult?.success || !statsResult.data) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const stats = statsResult.data;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Total Orders</p>
                            <p className="text-2xl font-bold">{stats.totalOrders}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <div>
                            <p className="text-sm font-medium">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.statusBreakdown && stats.statusBreakdown[OrderStatus.PENDING] || 0}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium">Processing</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.statusBreakdown && stats.statusBreakdown[OrderStatus.PROCESSING] || 0}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <div>
                            <p className="text-sm font-medium">Shipped</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats.statusBreakdown && stats.statusBreakdown[OrderStatus.SHIPPED] || 0}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                            <p className="text-sm font-medium">Delivered</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.statusBreakdown && stats.statusBreakdown[OrderStatus.DELIVERED] || 0}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <div>
                            <p className="text-sm font-medium">Cancelled</p>
                            <p className="text-2xl font-bold text-red-600">
                                {stats.statusBreakdown && stats.statusBreakdown[OrderStatus.CANCELLED] || 0}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}