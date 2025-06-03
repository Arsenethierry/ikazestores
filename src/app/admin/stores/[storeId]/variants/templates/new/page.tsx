import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAuthState } from "@/lib/user-label-permission";
import { getAllProductTypes } from "@/features/products/actions/variants management/product-types-actions";
import EnhancedVariantTemplateForm from "@/features/variants management/enhanced-variant-template-form";

interface CreateVariantTemplatePageProps {
    params: {
        storeId: string;
    };
    searchParams: {
        productType?: string;
    };
}

export default async function CreateVariantTemplatePage({
    params,
    searchParams
}: CreateVariantTemplatePageProps) {
const { user } = await getAuthState();

    if(!user) {
        redirect('/sign-in')
    }

    const productTypesResponse = await getAllProductTypes(params.storeId);
    const productTypes = productTypesResponse?.documents || [];

    return (
        <div className="container mx-auto py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/stores/${params.storeId}/variants`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Variants
                        </Link>
                    </Button>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Create Variant Template</h1>
                    <p className="text-muted-foreground">
                        Define a new variant template that can be used across products of the same type
                    </p>
                </div>

                <EnhancedVariantTemplateForm
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