'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRemoveVariantFromProductType } from "@/hooks/queries-and-mutations/use-catalog-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { Plus, MoreHorizontal, Trash2, Settings, Eye, Target } from "lucide-react";
import React, { Suspense, useCallback, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AssignVariantModal from "./components/assign-variant-modal";
import { CatalogProductTypeVariants } from "@/lib/types/appwrite/appwrite";

interface ProductTypeVariantsContainerProps {
    productTypeId: string;
    initialData: {
        documents: CatalogProductTypeVariants[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

const AssignedVariantItem = React.memo<{
    assignment: CatalogProductTypeVariants;
    onRemove: (assignmentId: string) => void;
}>(({
    assignment,
    onRemove
}) => {
    return (
        <Card className="transition-all hover:shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{assignment.variantTemplateName}</CardTitle>
                            <CardDescription className="text-sm">
                                {assignment.inputType} • {assignment.isRequired ? 'Required' : 'Optional'}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {assignment.isRequired && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configure Options
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => onRemove(assignment.$id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove Assignment
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
});

AssignedVariantItem.displayName = 'AssignedVariantItem';

export function ProductTypeVariantsContainer({ 
    productTypeId, 
    initialData 
}: ProductTypeVariantsContainerProps) {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignments, setAssignments] = useState(initialData.documents);

    const { execute: removeVariant } = useRemoveVariantFromProductType();
    const [ConfirmDialog, confirm] = useConfirm(
        "Remove Variant Assignment",
        "Are you sure you want to remove this variant template from this product type?",
        "destructive"
    );

    const handleRemove = useCallback(async (assignmentId: string) => {
        const assignment = assignments.find(a => a.$id === assignmentId);
        if (!assignment) return;

        const confirmed = await confirm();
        if (confirmed) {
            removeVariant({
                productTypeId,
                variantTemplateId: assignment.variantTemplateId
            });
            setAssignments(prev => prev.filter(a => a.$id !== assignmentId));
        }
    }, [confirm, removeVariant, productTypeId, assignments]);

    return (
        <div className="space-y-6">
            {/* Assigned Variants Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Assigned Variant Templates</h2>
                        <p className="text-sm text-muted-foreground">
                            Templates currently assigned to this product type
                        </p>
                    </div>
                    <Button onClick={() => setShowAssignModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Template
                    </Button>
                </div>

                {assignments.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            <Target className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No variants assigned</h3>
                            <p className="text-muted-foreground mb-4">
                                Assign variant templates to define product options like color, size, etc.
                            </p>
                            <Button onClick={() => setShowAssignModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Assign First Template
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {assignments.map((assignment) => (
                            <AssignedVariantItem
                                key={assignment.$id}
                                assignment={assignment}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>
                        Common tasks for managing product variants
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Product Configuration
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/admin/sys-admin/catalog/variant-templates" target="_blank">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Global Templates
                        </a>
                    </Button>
                </CardContent>
            </Card>

            {showAssignModal && (
                <Suspense fallback={null}>
                    <AssignVariantModal
                        productTypeId={productTypeId}
                        open={showAssignModal}
                        onOpenChange={setShowAssignModal}
                        onSuccess={(newAssignment) => {
                            setAssignments(prev => [...prev, newAssignment]);
                        }}
                    />
                </Suspense>
            )}

            <ConfirmDialog />
        </div>
    )
}

export function ProductTypeVariantsContainerSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

