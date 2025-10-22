import { CouponCodeModel, DiscountModel } from "@/lib/models/DiscountModel";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID } from "@/lib/env-config";
import { Query } from "node-appwrite";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Users, Percent, TrendingUp, Edit, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { CouponCodeManager } from "@/features/marketing/coupon-code-manager";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DiscountDetailsPageProps {
    params: { storeId: string; discountId: string };
}

export default async function PhysicalDiscountDetailsPage({ params }: DiscountDetailsPageProps) {
    const discountModel = new DiscountModel();

    const discount = await discountModel.getDiscountById(params.discountId);

    if (!discount) notFound();

    const couponModel = new CouponCodeModel();
    const coupons = await couponModel.getCouponsByDiscount(params.discountId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/stores/${params.storeId}/physical-store/marketing/discounts`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{discount.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            {discount.description || "Discount details and coupon management"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant={discount.isActive ? "default" : "secondary"}>
                        {discount.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/stores/${params.storeId}/physical-store/marketing/discounts/${params.discountId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Discount Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {discount.valueType === "percentage"
                                ? `${discount.value}%`
                                : `${discount.value} RWF`}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {discount.currentUsageCount}
                            {discount.usageLimit && ` / ${discount.usageLimit}`}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Duration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">
                            {format(new Date(discount.startDate), "MMM dd")}
                            {discount.endDate && ` - ${format(new Date(discount.endDate), "MMM dd")}`}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Priority
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{discount.priority}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Discount Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Discount Configuration</CardTitle>
                    <CardDescription>Detailed settings and conditions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Type</div>
                            <div className="font-medium capitalize">
                                {discount.discountType.replace("_", " ")}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Applies To</div>
                            <div className="font-medium capitalize">
                                {discount.applicableTo.replace("_", " ")}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Min Purchase</div>
                            <div className="font-medium">
                                {discount.minPurchaseAmount
                                    ? `${discount.minPurchaseAmount.toLocaleString()} RWF`
                                    : "None"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Min Quantity</div>
                            <div className="font-medium">{discount.minQuantity || "None"}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Max Discount</div>
                            <div className="font-medium">
                                {discount.maxDiscountAmount
                                    ? `${discount.maxDiscountAmount.toLocaleString()} RWF`
                                    : "None"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Can Stack</div>
                            <Badge variant={discount.canCombineWithOthers ? "default" : "secondary"}>
                                {discount.canCombineWithOthers ? "Yes" : "No"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Coupon Code Management */}
            <CouponCodeManager
                discountId={params.discountId}
                discountName={discount.name}
                storeId={params.storeId}
                existingCoupons={coupons}
            />
        </div>
    );
}