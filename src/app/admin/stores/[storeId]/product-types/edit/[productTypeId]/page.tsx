import { redirect, notFound } from "next/navigation";
import ProductTypeForm from "../../product-type-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAuthState } from "@/lib/user-label-permission";
import { getProductTypeById } from "@/features/products/actions/variants management/product-types-actions";

interface EditProductTypePageProps {
    params: {
        storeId: string;
        productTypeId: string;
    };
}

export default async function EditProductTypePage({ params }: EditProductTypePageProps) {
    const { user } = await getAuthState();

    if (!user) {
        redirect('/sign-in')
    }

    const productType = await getProductTypeById({ productTypeId: params.productTypeId });
    if (!productType) {
        notFound();
    }

    return (
        <div className="container mx-auto py-6">
            <div className="max-w-2xl mx-auto space-y-6">

                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/stores/${params.storeId}/product-types`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Product Types
                        </Link>
                    </Button>
                </div>


                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Edit Product Type</h1>
                    <p className="text-muted-foreground">
                        Make changes to &quot;{productType.name}&quot; product type
                    </p>
                </div>


                <ProductTypeForm
                    storeId={params.storeId}
                    userId={user.$id}
                    mode="edit"
                    initialData={{
                        productTypeId: productType.$id,
                        name: productType.name,
                        description: productType.description || "",
                        storeId: productType.storeId,
                        createdBy: productType.createdBy
                    }}
                />
            </div>
        </div>
    );
}