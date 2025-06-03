// app/admin/stores/[storeId]/variants/groups/edit/[groupId]/page.tsx

import { redirect, notFound } from "next/navigation";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, VARIANT_GROUPS_COLLECTION_ID } from "@/lib/env-config";
import VariantGroupForm from "../../../variant-group-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAuthState } from "@/lib/user-label-permission";
import { getAllProductTypes } from "@/features/products/actions/variants management/product-types-actions";

interface EditVariantGroupPageProps {
    params: {
        storeId: string;
        groupId: string;
    };
}

export default async function EditVariantGroupPage({ params }: EditVariantGroupPageProps) {
    const { user } = await getAuthState();

    if (!user) {
        redirect('/sign-in')
    }


    // Fetch the variant group to edit
    let variantGroup;
    try {
        const { databases } = await createSessionClient();
        variantGroup = await databases.getDocument(
            DATABASE_ID,
            VARIANT_GROUPS_COLLECTION_ID,
            params.groupId
        );

        // Verify user has access to this group
        if (variantGroup.storeId && variantGroup.storeId !== params.storeId) {
            notFound();
        }
    } catch (error) {
        console.error("Error fetching variant group:", error);
        notFound();
    }

    // Get product types for the form
    const productTypesResponse = await getAllProductTypes(params.storeId);
    const productTypes = productTypesResponse?.documents || [];

    // Format the initial data for the form
    const initialData = {
        groupId: variantGroup.$id,
        name: variantGroup.name,
        description: variantGroup.description || "",
        productType: variantGroup.productType,
        variants: variantGroup.variants || [],
        storeId: variantGroup.storeId,
        createdBy: variantGroup.createdBy
    };

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
                    <h1 className="text-3xl font-bold tracking-tight">Edit Variant Group</h1>
                    <p className="text-muted-foreground">
                        Make changes to &quot;{variantGroup.name}&ldquo; variant group
                    </p>
                </div>

                {/* Form */}
                <VariantGroupForm
                    storeId={params.storeId}
                    userId={user.$id}
                    productTypes={productTypes}
                    editMode={true}
                    initialData={initialData}
                />
            </div>
        </div>
    );
}