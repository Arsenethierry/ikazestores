// import { Suspense } from "react";
// import { notFound } from "next/navigation";
// import Link from "next/link";
// import { ArrowLeft, Edit, Settings } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import { getVariantTemplateDetails } from "@/features/variants management/actions/variant-management-actions";

// interface VariantTemplateDetailsPageProps {
//     params: {
//         templateId: string;
//     };
// }

// export default async function VariantTemplateDetailsPage({ params }: VariantTemplateDetailsPageProps) {
//     return (
//         <div className="container mx-auto py-6">
//             <Suspense fallback={<VariantTemplateDetailsPageSkeleton />}>
//                 <VariantTemplateDetailsContent templateId={params.templateId} />
//             </Suspense>
//         </div>
//     );
// }

// async function VariantTemplateDetailsContent({ templateId }: { templateId: string }) {
//     const templateData = await getVariantTemplateDetails(templateId);
//     console.log(templateData)
//     if (!templateData || !templateData.variantTemplate) {
//         notFound();
//     }

//     const { variantTemplate, variantOptions, productType } = templateData;

//     return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                     <Link href="/admin/variant-templates">
//                         <Button variant="ghost" size="icon">
//                             <ArrowLeft className="h-4 w-4" />
//                         </Button>
//                     </Link>
//                     <div>
//                         <h1 className="text-3xl font-bold tracking-tight">{variantTemplate.name}</h1>
//                         <p className="text-muted-foreground">Variant Template Details</p>
//                     </div>
//                 </div>
//                 <div className="flex space-x-3">
//                     <Link href={`/admin/variant-templates/${templateId}/edit`}>
//                         <Button>
//                             <Edit className="mr-2 h-4 w-4" />
//                             Edit
//                         </Button>
//                     </Link>
//                     <Link href={`/admin/variant-templates/${templateId}/options`}>
//                         <Button variant="outline">
//                             <Settings className="mr-2 h-4 w-4" />
//                             Manage Options
//                         </Button>
//                     </Link>
//                 </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Basic Information</CardTitle>
//                         <CardDescription>Core details about this variant template</CardDescription>
//                     </CardHeader>
//                     <CardContent className="space-y-4">
//                         <div>
//                             <p className="text-sm font-medium text-muted-foreground">Name</p>
//                             <p className="text-lg">{variantTemplate.name}</p>
//                         </div>
//                         {variantTemplate.description && (
//                             <div>
//                                 <p className="text-sm font-medium text-muted-foreground">Description</p>
//                                 <p>{variantTemplate.description}</p>
//                             </div>
//                         )}
//                         <div>
//                             <p className="text-sm font-medium text-muted-foreground">Type</p>
//                             <Badge variant="outline">{variantTemplate.type}</Badge>
//                         </div>
//                         <div>
//                             <p className="text-sm font-medium text-muted-foreground">Required</p>
//                             <Badge variant={variantTemplate.isRequired ? "default" : "secondary"}>
//                                 {variantTemplate.isRequired ? "Yes" : "No"}
//                             </Badge>
//                         </div>
//                         {productType && (
//                             <div>
//                                 <p className="text-sm font-medium text-muted-foreground">Product Type</p>
//                                 <p>{productType.name}</p>
//                             </div>
//                         )}
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Options</CardTitle>
//                         <CardDescription>Available options for this variant</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         {!variantOptions || variantOptions.length === 0 ? (
//                             <p className="text-muted-foreground">No options defined</p>
//                         ) : (
//                             <div className="space-y-2">
//                                 {variantOptions.map((option) => (
//                                     <div key={option.$id} className="flex items-center justify-between p-2 border rounded">
//                                         <div>
//                                             <p className="font-medium">{option.label}</p>
//                                             <p className="text-sm text-muted-foreground">Value: {option.value}</p>
//                                         </div>
//                                         {option.additionalPrice > 0 && (
//                                             <Badge variant="outline">+${option.additionalPrice}</Badge>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </CardContent>
//                 </Card>
//             </div>

//             <Card>
//                 <CardHeader>
//                     <CardTitle>Metadata</CardTitle>
//                     <CardDescription>System information and timestamps</CardDescription>
//                 </CardHeader>
//                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <p className="text-sm font-medium text-muted-foreground">Created</p>
//                         <p>{new Date(variantTemplate.$createdAt).toLocaleDateString("en-US", {
//                             year: "numeric",
//                             month: "long",
//                             day: "numeric",
//                             hour: "2-digit",
//                             minute: "2-digit"
//                         })}</p>
//                     </div>
//                     <div>
//                         <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
//                         <p>{new Date(variantTemplate.$updatedAt).toLocaleDateString("en-US", {
//                             year: "numeric",
//                             month: "long",
//                             day: "numeric",
//                             hour: "2-digit",
//                             minute: "2-digit"
//                         })}</p>
//                     </div>
//                     <div>
//                         <p className="text-sm font-medium text-muted-foreground">Template ID</p>
//                         <p className="font-mono text-sm">{variantTemplate.$id}</p>
//                     </div>
//                     <div>
//                         <p className="text-sm font-medium text-muted-foreground">Status</p>
//                         <Badge variant={variantTemplate.isActive !== false ? "default" : "secondary"}>
//                             {variantTemplate.isActive !== false ? "Active" : "Inactive"}
//                         </Badge>
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }

// function VariantTemplateDetailsPageSkeleton() {
//     return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                     <Skeleton className="h-10 w-10" />
//                     <div>
//                         <Skeleton className="h-8 w-48" />
//                         <Skeleton className="h-4 w-32 mt-2" />
//                     </div>
//                 </div>
//                 <div className="flex space-x-3">
//                     <Skeleton className="h-10 w-24" />
//                     <Skeleton className="h-10 w-32" />
//                 </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <Skeleton className="h-64" />
//                 <Skeleton className="h-64" />
//             </div>

//             <Skeleton className="h-48" />
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