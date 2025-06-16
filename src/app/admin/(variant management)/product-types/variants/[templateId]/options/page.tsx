import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, MoveUp, MoveDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, VARIANT_TEMPLATES_COLLECTION_ID, VARIANT_OPTIONS_COLLECTION_ID } from "@/lib/env-config";
import { Query } from "node-appwrite";
import { VariantTemplate, VariantOptions } from "@/lib/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface VariantTemplateOptionsPageProps {
    params: {
        templateId: string;
    };
}

export default async function VariantTemplateOptionsPage({ params }: VariantTemplateOptionsPageProps) {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<VariantTemplateOptionsPageSkeleton />}>
                <VariantTemplateOptionsContent templateId={params.templateId} />
            </Suspense>
        </div>
    );
}

async function VariantTemplateOptionsContent({ templateId }: { templateId: string }) {
    const { databases } = await createSessionClient();

    const variantTemplate = await databases.getDocument<VariantTemplate>(
        DATABASE_ID,
        VARIANT_TEMPLATES_COLLECTION_ID,
        templateId
    );

    if (!variantTemplate || variantTemplate.storeId) {
        notFound();
    }

    // Get variant options
    const variantOptionsResponse = await databases.listDocuments<VariantOptions>(
        DATABASE_ID,
        VARIANT_OPTIONS_COLLECTION_ID,
        [
            Query.equal("variantTemplateId", templateId),
            // Query.orderAsc("sortOrder")
        ]
    );

    const variantOptions = variantOptionsResponse.documents;

    // Check if this variant type supports options
    const supportsOptions = ['select', 'multiselect', 'color'].includes(variantTemplate.type);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/variant-templates">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Options for {variantTemplate.name}
                        </h1>
                        <p className="text-muted-foreground">
                            Manage options for this variant template
                        </p>
                    </div>
                </div>
                <Link href={`/admin/variant-templates/${templateId}/edit`}>
                    <Button>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Template
                    </Button>
                </Link>
            </div>

            {!supportsOptions ? (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        This variant type ({variantTemplate.type}) does not support predefined options.
                        Options are only available for select, multiselect, and color variant types.
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Information</CardTitle>
                            <CardDescription>Basic details about this variant template</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                                    <Badge variant="outline">{variantTemplate.type}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Required</p>
                                    <Badge variant={variantTemplate.isRequired ? "default" : "secondary"}>
                                        {variantTemplate.isRequired ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Options</p>
                                    <p className="font-medium">{variantOptions.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <Badge variant={variantTemplate.isActive !== false ? "default" : "secondary"}>
                                        {variantTemplate.isActive !== false ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {variantOptions.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No options defined</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    This variant template doesn&apos;`t have any options yet. Add options by editing the template.
                                </p>
                                <Link href={`/admin/variant-templates/${templateId}/edit`}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Options
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Variant Options</CardTitle>
                                <CardDescription>
                                    All available options for this variant template
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            {variantTemplate.type === 'color' && (
                                                <TableHead className="w-[80px]">Preview</TableHead>
                                            )}
                                            <TableHead>Label</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Additional Price</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {variantOptions.map((option, index) => (
                                            <TableRow key={option.$id}>
                                                <TableCell className="font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                {variantTemplate.type === 'color' && (
                                                    <TableCell>
                                                        {option.imageUrl ? (
                                                            <div className="relative w-10 h-10">
                                                                <Image
                                                                    src={option.imageUrl}
                                                                    alt={option.label}
                                                                    fill
                                                                    className="object-cover rounded border"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                                                                <span className="text-xs text-muted-foreground">N/A</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className="font-medium">
                                                    {option.label}
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                                                        {option.value}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    {option.additionalPrice > 0 ? (
                                                        <Badge variant="outline">
                                                            +${option.additionalPrice.toFixed(2)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={index === 0}
                                                        >
                                                            <MoveUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={index === variantOptions.length - 1}
                                                        >
                                                            <MoveDown className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

function VariantTemplateOptionsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <Skeleton className="h-32" />

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
