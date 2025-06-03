import { redirect } from "next/navigation";
import VariantGroupForm from "../../variant-group-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAllProductTypes } from "@/features/products/actions/variants management/product-types-actions";
import { getAuthState } from "@/lib/user-label-permission";

interface CreateVariantGroupPageProps {
    params: {
        storeId: string;
    };
    searchParams: {
        productType?: string;
    };
}

export default async function CreateVariantGroupPage({
    params,
    searchParams
}: CreateVariantGroupPageProps) {
    const { user } = await getAuthState();

    if (!user) {
        redirect('/sign-in')
    }

    const productTypesResponse = await getAllProductTypes(params.storeId);
    const productTypes = productTypesResponse?.documents || [];

    return (
        <div className="container mx-auto py-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/stores/${params.storeId}/variants`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Variants
                        </Link>
                    </Button>
                </div>

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Create Variant Group</h1>
                    <p className="text-muted-foreground">
                        Group related variant templates together to simplify product setup
                    </p>
                </div>

                {/* Form */}
                <VariantGroupForm
                    storeId={params.storeId}
                    userId={user.$id}
                    productTypes={productTypes}
                    editMode={false}
                    preSelectedProductType={searchParams.productType}
                />
            </div>
        </div>
    );
}