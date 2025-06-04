import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAllProductTypes } from "@/features/products/actions/variants management/product-types-actions";
import EnhancedVariantTemplateForm from "@/features/variants management/enhanced-variant-template-form";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, VARIANT_TEMPLATES_COLLECTION_ID, VARIANT_OPTIONS_COLLECTION_ID } from "@/lib/env-config";
import { Query } from "node-appwrite";
import { VariantTemplate, VariantOptions } from "@/lib/types";
import { getAuthState } from "@/lib/user-label-permission";

interface EditVariantTemplatePageProps {
    params: {
        templateId: string;
    };
}

export default async function EditVariantTemplatePage({ params }: EditVariantTemplatePageProps) {
    const { user } = await getAuthState();

    if (!user) {
        redirect('/signin')
    }

    const { databases } = await createSessionClient();

    // Get the variant template
    const variantTemplate = await databases.getDocument<VariantTemplate>(
        DATABASE_ID,
        VARIANT_TEMPLATES_COLLECTION_ID,
        params.templateId
    );

    if (!variantTemplate) {
        notFound();
    }

    // Get variant options
    const variantOptionsResponse = await databases.listDocuments<VariantOptions>(
        DATABASE_ID,
        VARIANT_OPTIONS_COLLECTION_ID,
        [Query.equal("variantTemplateId", params.templateId)]
    );

    // Get all global product types
    const productTypesResponse = await getAllProductTypes();
    const productTypes = productTypesResponse?.documents || [];

    // Format data for the form
    const initialData = {
        templateId: variantTemplate.$id,
        name: variantTemplate.name,
        description: variantTemplate.description || "",
        type: variantTemplate.type,
        isRequired: variantTemplate.isRequired,
        defaultValue: variantTemplate.defaultValue || "",
        priceModifier: variantTemplate.priceModifier || 0,
        productType: variantTemplate.productTypeId || "",
        createdBy: variantTemplate.createdBy,
        storeId: null,
        options: variantOptionsResponse.documents.map((opt, index) => ({
            value: opt.value,
            label: opt.label,
            additionalPrice: opt.additionalPrice,
            sortOrder: opt.sortOrder || index,
            image: opt.imageUrl
        }))
    };

    return (
        <div className="container mx-auto py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/variant-templates">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Variant Templates
                        </Link>
                    </Button>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Edit Variant Template</h1>
                    <p className="text-muted-foreground">
                        Make changes to this global variant template
                    </p>
                </div>

                <EnhancedVariantTemplateForm
                    userId={user.$id}
                    productTypes={productTypes}
                    editMode={true}
                    initialData={initialData}
                />
            </div>
        </div>
    );
}
