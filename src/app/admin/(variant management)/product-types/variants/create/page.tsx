// import { redirect } from "next/navigation";
// import { ArrowLeft } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { getAllProductTypes } from "@/features/categories/actions/product-types-actions";
// import EnhancedVariantTemplateForm from "@/features/variants management/enhanced-variant-template-form";
// import { getAuthState } from "@/lib/user-label-permission";

// interface CreateVariantTemplatePageProps {
//     searchParams: {
//         productType?: string;
//     };
// }

// export default async function CreateVariantTemplatePage({
//     searchParams
// }: CreateVariantTemplatePageProps) {
//     const { user } = await getAuthState();

//     if (!user) {
//         redirect('/signin')
//     }

//     const productTypesResponse = await getAllProductTypes();
//     const productTypes = productTypesResponse?.documents || [];

//     return (
//         <div className="container mx-auto py-6">
//             <div className="max-w-4xl mx-auto space-y-6">
//                 <div className="flex items-center space-x-2">
//                     <Button variant="ghost" size="sm" asChild>
//                         <Link href="/admin/variant-templates">
//                             <ArrowLeft className="mr-2 h-4 w-4" />
//                             Back to Variant Templates
//                         </Link>
//                     </Button>
//                 </div>

//                 <div className="space-y-2">
//                     <h1 className="text-3xl font-bold tracking-tight">Create Global Variant Template</h1>
//                     <p className="text-muted-foreground">
//                         Define a new variant template that can be used across all stores
//                     </p>
//                 </div>

//                 <EnhancedVariantTemplateForm
//                     userId={user.$id}
//                     productTypes={productTypes}
//                     editMode={false}
//                     preSelectedProductType={searchParams.productType}
//                 />
//             </div>
//         </div>
//     );
// }
import React from 'react';

function page() {
    return (
        <div>
           Under maintenance 
        </div>
    );
}

export default page;