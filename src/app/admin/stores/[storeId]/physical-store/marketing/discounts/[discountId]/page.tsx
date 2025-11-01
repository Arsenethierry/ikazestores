import { Suspense } from "react";
import { CouponCodeModel, DiscountModel } from "@/lib/models/DiscountModel";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Users, Percent, TrendingUp, ArrowLeft, Tag, Target } from "lucide-react";
import { notFound } from "next/navigation";
import { CouponCodeManager, CouponCodeManagerSkeleton } from "@/features/marketing/coupon-code-manager";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditDiscountButton } from "@/features/marketing/edit-discount-button";

interface DiscountDetailsPageProps {
    params: Promise<{ storeId: string; discountId: string }>;
}

export const revalidate = 300;

export default async function PhysicalDiscountDetailsPage({ params }: DiscountDetailsPageProps) {
    const { storeId, discountId } = await params;

    const discountModel = new DiscountModel();
    const discount = await discountModel.getDiscountById(discountId);

    if (!discount) notFound();

    const applicableToText = discount.applicableTo === "store_wide"
        ? "Store-wide (All Products)"
        : "Specific Products";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/stores/${storeId}/physical-store/marketing/discounts`}>
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
                    <EditDiscountButton
                        discount={discount}
                        storeId={storeId}
                    />
                </div>
            </div>

            {/* Stats Grid - 5 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Discount Value */}
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
                        <p className="text-xs text-muted-foreground mt-1">
                            {discount.valueType === "percentage" ? "Percentage off" : "Fixed amount off"}
                        </p>
                    </CardContent>
                </Card>

                {/* Usage */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {discount.currentUsageCount || 0}
                            {discount.usageLimit && ` / ${discount.usageLimit}`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {discount.usageLimit
                                ? `${discount.usageLimit - (discount.currentUsageCount || 0)} remaining`
                                : "Unlimited uses"}
                        </p>
                    </CardContent>
                </Card>

                {/* Duration */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Duration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <div className="text-sm font-medium">
                                {format(new Date(discount.startDate), "MMM dd, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                to{" "}
                                {discount.endDate
                                    ? format(new Date(discount.endDate), "MMM dd, yyyy")
                                    : "No end date"}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Applicable to */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Applicable to
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">
                            {applicableToText}
                        </div>
                        {discount.applicableTo === "products" && discount.targetIds && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {discount.targetIds.length} product(s) selected
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Priority */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Priority
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {discount.priority}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {discount.priority > 50 ? "High priority" : "Standard priority"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Discount Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="text-sm font-semibold mt-1 capitalize">
                            {discount.discountType.replace(/_/g, " ")}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Can Stack</p>
                        <p className="text-sm font-semibold mt-1">
                            {discount.canCombineWithOthers ? "Yes" : "No"}
                        </p>
                    </div>
                    {discount.minPurchaseAmount && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Minimum Purchase
                            </p>
                            <p className="text-sm font-semibold mt-1">
                                {discount.minPurchaseAmount} RWF
                            </p>
                        </div>
                    )}
                    {discount.maxDiscountAmount && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Maximum Discount
                            </p>
                            <p className="text-sm font-semibold mt-1">
                                {discount.maxDiscountAmount} RWF
                            </p>
                        </div>
                    )}
                    {discount.minQuantity && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Minimum Quantity
                            </p>
                            <p className="text-sm font-semibold mt-1">
                                {discount.minQuantity}
                            </p>
                        </div>
                    )}
                    {discount.buyXQuantity && discount.getYQuantity && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Buy X Get Y
                            </p>
                            <p className="text-sm font-semibold mt-1">
                                Buy {discount.buyXQuantity}, Get {discount.getYQuantity}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Suspense fallback={<CouponCodeManagerSkeleton />}>
                <CouponCodesLoader
                    discountId={discountId}
                    discountName={discount.name}
                    storeId={storeId}
                />
            </Suspense>
        </div>
    );
}

async function CouponCodesLoader({
    discountId,
    discountName,
    storeId,
}: {
    discountId: string;
    discountName: string;
    storeId: string;
}) {
    const couponModel = new CouponCodeModel();
    const coupons = await couponModel.getCouponsByDiscount(discountId);

    return (
        <CouponCodeManager
            discountId={discountId}
            discountName={discountName}
            storeId={storeId}
            existingCoupons={coupons}
        />
    );
}