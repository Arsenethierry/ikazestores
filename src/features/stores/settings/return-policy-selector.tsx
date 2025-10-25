"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, ChevronRight, Store, Tag, Package, Globe, Plus, Edit } from "lucide-react";
import { ReturnPolicies } from "@/lib/types/appwrite/appwrite";
import Link from "next/link";

interface ReturnPolicySelectorProps {
    storeId: string;
    productId?: string;
    categoryId?: string;
    productPolicy?: ReturnPolicies | null;
    categoryPolicy?: ReturnPolicies | null;
    storePolicy?: ReturnPolicies | null;
    storeType: "physical" | "virtual";
}

// Platform-wide default policy (hardcoded)
const PLATFORM_DEFAULT_POLICY = {
    returnWindowDays: 30,
    allowReturns: true,
    allowExchanges: true,
    restockingFeePercent: 0,
    requiresOriginalPackaging: true,
    requiresReceipt: true,
    shippingCostResponsibility: "customer" as const,
};

export function ReturnPolicySelector({
    storeId,
    productId,
    categoryId,
    productPolicy,
    categoryPolicy,
    storePolicy,
    storeType,
}: ReturnPolicySelectorProps) {
    // Determine active policy based on hierarchy
    const activePolicy = productPolicy || categoryPolicy || storePolicy || PLATFORM_DEFAULT_POLICY;
    const activePolicyLevel = productPolicy
        ? "product"
        : categoryPolicy
            ? "category"
            : storePolicy
                ? "store"
                : "platform";

    const formatShippingResponsibility = (responsibility: string) => {
        return responsibility.charAt(0).toUpperCase() + responsibility.slice(1).replace("_", " ");
    };

    const getPolicyLevelColor = (level: string) => {
        switch (level) {
            case "product":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
            case "category":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "store":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "platform":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const renderPolicyItem = (
        level: string,
        icon: React.ElementType,
        label: string,
        policy: any,
        isActive: boolean
    ) => {
        const Icon = icon;
        return (
            <div
                className={`relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${isActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-accent"
                    }`}
            >
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="font-medium">{label}</p>
                        {isActive && (
                            <Badge variant="default" className="text-xs">
                                Active
                            </Badge>
                        )}
                        {!policy && level !== "platform" && (
                            <Badge variant="outline" className="text-xs">
                                Not Set
                            </Badge>
                        )}
                    </div>

                    {policy && (
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>{policy.returnWindowDays} days</span>
                            <span>•</span>
                            <span>
                                {policy.allowReturns ? "Returns ✓" : "Returns ✗"}
                            </span>
                            <span>•</span>
                            <span>
                                {policy.allowExchanges ? "Exchanges ✓" : "Exchanges ✗"}
                            </span>
                            {policy.restockingFeePercent && policy.restockingFeePercent > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{policy.restockingFeePercent}% restocking fee</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {policy && level !== "platform" && (
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="shrink-0"
                    >
                        <Link
                            href={`/admin/stores/${storeId}/${storeType}-store/settings/return-policies/${(policy as ReturnPolicies).$id
                                }`}
                        >
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                )}

                {!policy && level !== "platform" && (
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="shrink-0"
                    >
                        <Link
                            href={`/admin/stores/${storeId}/${storeType}-store/settings/return-policies/new?${level === "product"
                                    ? `productId=${productId}`
                                    : level === "category"
                                        ? `categoryId=${categoryId}`
                                        : ""
                                }`}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Create
                        </Link>
                    </Button>
                )}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Return Policy
                </CardTitle>
                <CardDescription>
                    Policy hierarchy: Product → Category → Store → Platform
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Active Policy Summary */}
                <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge className={getPolicyLevelColor(activePolicyLevel)}>
                            {activePolicyLevel.toUpperCase()} LEVEL
                        </Badge>
                        <span className="text-sm font-medium">Currently Applied</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Return Window:</span>
                            <p className="font-medium">{activePolicy.returnWindowDays} days</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Returns:</span>
                            <p className="font-medium">
                                {activePolicy.allowReturns ? "Allowed" : "Not Allowed"}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Exchanges:</span>
                            <p className="font-medium">
                                {activePolicy.allowExchanges ? "Allowed" : "Not Allowed"}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Restocking Fee:</span>
                            <p className="font-medium">{activePolicy.restockingFeePercent}%</p>
                        </div>
                        {activePolicy.shippingCostResponsibility && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Shipping Cost:</span>
                                <p className="font-medium">
                                    {formatShippingResponsibility(
                                        activePolicy.shippingCostResponsibility
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Policy Hierarchy */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Policy Hierarchy</h4>

                    {/* Product Level */}
                    {productId &&
                        renderPolicyItem(
                            "product",
                            Package,
                            "Product-Specific Policy",
                            productPolicy,
                            activePolicyLevel === "product"
                        )}

                    {productId && <ChevronRight className="h-4 w-4 mx-auto text-muted-foreground" />}

                    {/* Category Level */}
                    {categoryId &&
                        renderPolicyItem(
                            "category",
                            Tag,
                            "Category Policy",
                            categoryPolicy,
                            activePolicyLevel === "category"
                        )}

                    {categoryId && <ChevronRight className="h-4 w-4 mx-auto text-muted-foreground" />}

                    {/* Store Level */}
                    {renderPolicyItem(
                        "store",
                        Store,
                        "Store Default Policy",
                        storePolicy,
                        activePolicyLevel === "store"
                    )}

                    <ChevronRight className="h-4 w-4 mx-auto text-muted-foreground" />

                    {/* Platform Level */}
                    {renderPolicyItem(
                        "platform",
                        Globe,
                        "Platform Default Policy",
                        PLATFORM_DEFAULT_POLICY,
                        activePolicyLevel === "platform"
                    )}
                </div>

                {/* Help Text */}
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="space-y-1 text-xs">
                        <li>• More specific policies override general ones</li>
                        <li>• Product policy takes highest priority</li>
                        <li>• If no policy is set, the next level is used</li>
                        <li>• Platform policy is the final fallback</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}