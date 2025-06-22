// import { Suspense } from "react";
// import { Plus, Filter, Package } from "lucide-react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Input } from "@/components/ui/input";
// import { createSessionClient } from "@/lib/appwrite";
// import { DATABASE_ID, VARIANT_TEMPLATES_COLLECTION_ID, VARIANT_OPTIONS_COLLECTION_ID } from "@/lib/env-config";
// import { Query } from "node-appwrite";
// import { VariantTemplate, VariantOptions } from "@/lib/types";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

// export default async function VariantTemplatesPage() {
//     return (
//         <div className="container mx-auto py-6">
//             <Suspense fallback={<VariantTemplatesPageSkeleton />}>
//                 <VariantTemplatesContent />
//             </Suspense>
//         </div>
//     );
// }

// async function VariantTemplatesContent() {
//     const { databases } = await createSessionClient();

//     const variantTemplatesResponse = await databases.listDocuments<VariantTemplate>(
//         DATABASE_ID,
//         VARIANT_TEMPLATES_COLLECTION_ID,
//         [Query.isNull("storeId")]
//     );

//     const variantTemplates = variantTemplatesResponse.documents || [];

//     const templateIds = variantTemplates.map(t => t.$id);
//     const variantOptionsResponse = templateIds.length > 0 
//         ? await databases.listDocuments<VariantOptions>(
//             DATABASE_ID,
//             VARIANT_OPTIONS_COLLECTION_ID,
//             [Query.equal("variantTemplateId", templateIds)]
//         )
//         : { documents: [] };

//     const optionsMap = new Map<string, VariantOptions[]>();
//     variantOptionsResponse.documents.forEach(option => {
//         const existing = optionsMap.get(option.variantTemplateId) || [];
//         optionsMap.set(option.variantTemplateId, [...existing, option]);
//     });

//     return (
//         <div className="space-y-6">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold tracking-tight">Variant Templates</h1>
//                     <p className="text-muted-foreground">
//                         Manage global variant templates that can be used across all stores
//                     </p>
//                 </div>
//                 <Link href="/admin/variant-templates/create">
//                     <Button>
//                         <Plus className="mr-2 h-4 w-4" />
//                         New Template
//                     </Button>
//                 </Link>
//             </div>

//             <div className="flex items-center space-x-2">
//                 <div className="relative flex-1 max-w-sm">
//                     <Input
//                         placeholder="Search templates..."
//                         className="pl-8"
//                     />
//                     <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                 </div>
//             </div>

//             {/* Stats */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
//                         <Package className="h-4 w-4 text-muted-foreground" />
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">{variantTemplates.length}</div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
//                         <Package className="h-4 w-4 text-muted-foreground" />
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">
//                             {variantTemplates.filter(t => t.isActive !== false).length}
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Required Templates</CardTitle>
//                         <Package className="h-4 w-4 text-muted-foreground" />
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">
//                             {variantTemplates.filter(t => t.isRequired).length}
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Templates Grid */}
//             {variantTemplates.length === 0 ? (
//                 <div className="text-center py-12">
//                     <Package className="mx-auto h-12 w-12 text-muted-foreground" />
//                     <h3 className="mt-4 text-lg font-semibold">
//                         No variant templates yet
//                     </h3>
//                     <p className="mt-2 text-muted-foreground">
//                         Get started by creating your first global variant template
//                     </p>
//                     <Link href="/admin/variant-templates/create">
//                         <Button className="mt-4">
//                             <Plus className="mr-2 h-4 w-4" />
//                             Create Template
//                         </Button>
//                     </Link>
//                 </div>
//             ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {variantTemplates.map((template) => {
//                         const options = optionsMap.get(template.$id) || [];

//                         return (
//                             <Card key={template.$id} className="hover:shadow-md transition-shadow">
//                                 <CardHeader className="pb-3">
//                                     <div className="flex items-start justify-between">
//                                         <div className="space-y-1">
//                                             <CardTitle className="text-lg">{template.name}</CardTitle>
//                                             {template.description && (
//                                                 <CardDescription className="line-clamp-2">
//                                                     {template.description}
//                                                 </CardDescription>
//                                             )}
//                                         </div>
//                                         <DropdownMenu>
//                                             <DropdownMenuTrigger asChild>
//                                                 <Button variant="ghost" size="icon" className="h-8 w-8">
//                                                     <MoreHorizontal className="h-4 w-4" />
//                                                 </Button>
//                                             </DropdownMenuTrigger>
//                                             <DropdownMenuContent align="end">
//                                                 <DropdownMenuItem asChild>
//                                                     <Link href={`/admin/variant-templates/${template.$id}/edit`}>
//                                                         <Edit className="mr-2 h-4 w-4" />
//                                                         Edit
//                                                     </Link>
//                                                 </DropdownMenuItem>
//                                                 <DropdownMenuItem
//                                                     className="text-destructive"
//                                                 >
//                                                     <Trash2 className="mr-2 h-4 w-4" />
//                                                     Delete
//                                                 </DropdownMenuItem>
//                                             </DropdownMenuContent>
//                                         </DropdownMenu>
//                                     </div>
//                                 </CardHeader>

//                                 <CardContent className="pt-0">
//                                     <div className="space-y-3">
//                                         <div className="flex items-center justify-between text-sm">
//                                             <span className="text-muted-foreground">Type:</span>
//                                             <Badge variant="outline">{template.type}</Badge>
//                                         </div>

//                                         <div className="flex items-center justify-between text-sm">
//                                             <span className="text-muted-foreground">Options:</span>
//                                             <span>{options.length}</span>
//                                         </div>

//                                         <div className="flex items-center justify-between text-sm">
//                                             <span className="text-muted-foreground">Required:</span>
//                                             <Badge variant={template.isRequired ? "default" : "secondary"}>
//                                                 {template.isRequired ? "Yes" : "No"}
//                                             </Badge>
//                                         </div>
//                                     </div>

//                                     <div className="flex space-x-2 mt-4">
//                                         <Link href={`/admin/variant-templates/${template.$id}`} className="flex-1">
//                                             <Button variant="outline" size="sm" className="w-full">
//                                                 View Details
//                                             </Button>
//                                         </Link>
//                                         <Link href={`/admin/variant-templates/${template.$id}/options`} className="flex-1">
//                                             <Button variant="outline" size="sm" className="w-full">
//                                                 Manage Options
//                                             </Button>
//                                         </Link>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         );
//                     })}
//                 </div>
//             )}
//         </div>
//     );
// }

// function VariantTemplatesPageSkeleton() {
//     return (
//         <div className="space-y-6">
//             <div className="flex justify-between items-center">
//                 <Skeleton className="h-8 w-64" />
//                 <Skeleton className="h-10 w-32" />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {Array.from({ length: 3 }).map((_, i) => (
//                     <Skeleton key={i} className="h-32" />
//                 ))}
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {Array.from({ length: 6 }).map((_, i) => (
//                     <div key={i} className="p-6 border rounded-lg space-y-4">
//                         <Skeleton className="h-6 w-32" />
//                         <Skeleton className="h-4 w-full" />
//                         <Skeleton className="h-4 w-3/4" />
//                         <div className="flex space-x-2">
//                             <Skeleton className="h-8 w-16" />
//                             <Skeleton className="h-8 w-16" />
//                         </div>
//                     </div>
//                 ))}
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