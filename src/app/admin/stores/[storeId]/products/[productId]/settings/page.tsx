import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductModel } from "@/lib/models/ProductModel";
import { AffiliateProductModel } from "@/lib/models/AffliateProductModel";
import { ReturnPolicyModel } from "@/lib/models/ReturnPolicyModel";
import { ProductBadgeModel } from "@/lib/models/ProductBadgeModel";
import { PriceQuickEdit } from "@/features/products/components/price-quick-edit";
import { ProductTogglePanel } from "@/features/products/components/product-toggle-panel";
import { ReturnPolicySelector } from "@/features/stores/settings/return-policy-selector";
import { BadgeStatusIndicators } from "@/features/stores/marketing/badge-status-indicators";

interface ProductSettingsPageProps {
    params: Promise<{
        storeId: string;
        productId: string;
    }>;
}

async function ProductSettingsContent({
    storeId,
    productId,
}: {
    storeId: string;
    productId: string;
}) {
    const productModel = new ProductModel();
    const affiliateModel = new AffiliateProductModel();
    const policyModel = new ReturnPolicyModel();
    const badgeModel = new ProductBadgeModel();

    // Try to fetch as physical product first
    let product: any = await productModel.findProductById(productId);
    let type: "physical" | "virtual" = "physical";
    let originalProduct: any = null;

    // If not found or doesn't match storeId, try virtual product
    if (!product || product.physicalStoreId !== storeId) {
        const virtualProduct = await affiliateModel.findById(productId, {});

        if (virtualProduct && virtualProduct.virtualStoreId === storeId) {
            product = virtualProduct;
            type = "virtual";
            originalProduct = await productModel.findProductById(
                virtualProduct.productId
            );
        }
    }

    if (!product) {
        notFound();
    }

    // Fetch policies based on product type
    const categoryId =
        type === "physical"
            ? product.categoryId
            : originalProduct?.categoryId;

    let productPolicy = null;
    let categoryPolicy = null;
    let storePolicy = null;

    // Product-specific policy
    const productPolicyResult = await policyModel.findMany({
        filters: [
            { field: "storeId", operator: "equal", value: storeId },
            {
                field: "productId",
                operator: "equal",
                value: type === "physical" ? productId : originalProduct?.$id,
            },
        ],
        limit: 1,
    });
    productPolicy = productPolicyResult.documents[0] || null;

    // Category policy
    if (categoryId) {
        const categoryPolicyResult = await policyModel.findMany({
            filters: [
                { field: "storeId", operator: "equal", value: storeId },
                { field: "categoryId", operator: "equal", value: categoryId },
            ],
            limit: 1,
        });
        categoryPolicy = categoryPolicyResult.documents[0] || null;
    }

    // Store default policy
    const storePolicyResult = await policyModel.findMany({
        filters: [
            { field: "storeId", operator: "equal", value: storeId },
            { field: "isDefault", operator: "equal", value: true },
        ],
        limit: 1,
    });
    storePolicy = storePolicyResult.documents[0] || null;

    // Fetch badges
    const badgesResult = await badgeModel.findMany({
        filters: [
            {
                field: "productId",
                operator: "equal",
                value: type === "physical" ? productId : originalProduct?.$id,
            },
        ],
        limit: 50,
    });

    const productName =
        type === "physical" ? product.name : originalProduct?.name || "Product";
    const currency = type === "physical" ? product.currency : originalProduct?.currency || "RWF";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/stores/${storeId}/products/${productId}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Product Settings
                        </h1>
                        <p className="text-muted-foreground line-clamp-1">
                            {productName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Product Toggles */}
                    <ProductTogglePanel
                        product={type === "physical" ? product : { ...product, originalProduct }}
                        type={type}
                        storeId={storeId}
                    />

                    {/* Price Quick Edit */}
                    <PriceQuickEdit
                        product={type === "physical" ? product : { ...product, originalProduct }}
                        type={type}
                        currency={currency}
                    />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Return Policy */}
                    <ReturnPolicySelector
                        storeId={storeId}
                        productId={type === "physical" ? productId : originalProduct?.$id}
                        categoryId={categoryId}
                        productPolicy={productPolicy}
                        categoryPolicy={categoryPolicy}
                        storePolicy={storePolicy}
                        storeType={type}
                    />
                </div>
            </div>

            {/* Badge Status - Full Width */}
            <BadgeStatusIndicators
                productId={type === "physical" ? productId : originalProduct?.$id}
                storeId={storeId}
                badges={badgesResult.documents}
                storeType={type}
            />
        </div>
    );
}

function ProductSettingsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-80" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-[600px]" />
                </div>
            </div>

            <Skeleton className="h-64" />
        </div>
    );
}

export default async function ProductSettingsPage({
    params,
}: ProductSettingsPageProps) {
    const { storeId, productId } = await params;

    return (
        <Suspense fallback={<ProductSettingsSkeleton />}>
            <ProductSettingsContent storeId={storeId} productId={productId} />
        </Suspense>
    );
}