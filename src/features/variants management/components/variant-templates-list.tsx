/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ResponsiveModal } from "@/components/responsive-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteVariantTemplate } from "@/features/categories/actions/products-variant-templates-action";
import { VariantTemplate } from "@/lib/types";
import { Edit, Eye, Globe, Hash, List, MoreHorizontal, Palette, Plus, Settings, Sliders, Store, ToggleLeft, Trash2, Type } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CreateTemplateModal, EditTemplateModal, ViewTemplateModal } from "./template-modals";

interface VariantTemplatesListProps {
    templates: VariantTemplate[];
    productTypeId?: string;
    storeId?: string;
    showScope?: boolean;
    emptyMessage?: string;
    readonly?: boolean;
}

const VARIANT_TYPE_ICONS = {
    select: List,
    multiselect: List,
    color: Palette,
    boolean: ToggleLeft,
    text: Type,
    number: Hash,
    range: Sliders,
};

type ModalType = "create" | "edit" | "view" | null;

export function VariantTemplatesList({
    templates,
    storeId,
    showScope = true,
    // emptyMessage = "No variant templates found.",
    readonly = false
}: VariantTemplatesListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [modalState, setModalState] = useState<{
        type: ModalType;
        template?: VariantTemplate;
        isOpen: boolean;
    }>({
        type: null,
        template: undefined,
        isOpen: false
    });

    const { execute: deleteTemplate, isPending: isDeleting } = useAction(deleteVariantTemplate, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success(data.success);
                setDeletingId(null);
            } else if (data?.error) {
                toast.error(data.error);
            }
        },
        onError: (error) => {
            toast.error("Failed to delete variant template");
            console.error("Delete template error:", error);
        },
    });

    const openModal = (type: ModalType, template?: VariantTemplate) => {
        setModalState({
            type,
            template,
            isOpen: true
        });
    };

    const closeModal = () => {
        setModalState({
            type: null,
            template: undefined,
            isOpen: false
        })
    }

    const handleDelete = async (templateId: string) => {
        setDeletingId(templateId);
        await deleteTemplate({ templateId });
    };

    // if (templates.length === 0) {
    //     return (
    //         <Card>
    //             <CardContent className="flex flex-col items-center justify-center py-12">
    //                 <div className="text-center space-y-3">
    //                     <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
    //                         <List className="w-6 h-6 text-muted-foreground" />
    //                     </div>
    //                     <div>
    //                         <h3 className="text-lg font-semibold">No Templates Found</h3>
    //                         <p className="text-muted-foreground">{emptyMessage}</p>
    //                     </div>
    //                     {!readonly && (
    //                         <div className="flex gap-2 justify-center">
    //                             <Button onClick={() => openModal("create")}>Create Variant Template</Button>
    //                         </div>
    //                     )}
    //                 </div>
    //             </CardContent>
    //         </Card>
    //     );
    // }

    return (
        <>
            <div className="space-y-4">
                {!readonly && (
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium">Quick Actions</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Create and manage variant templates
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => openModal("create")} size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Quick Create
                                    </Button>
                                    <Link href={storeId ? `/admin/stores/${storeId}/variants/new` : "/admin/variants/new"}>
                                        <Button variant="outline" size="sm">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Advanced Create
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template: VariantTemplate) => {
                        const Icon = VARIANT_TYPE_ICONS[template.type as keyof typeof VARIANT_TYPE_ICONS] || List;
                        const isGlobal = !template.storeId;
                        const optionsCount = template.options?.length || 0;

                        return (
                            <Card key={template.$id} className="group hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-muted rounded-lg">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base line-clamp-1">
                                                    {template.name}
                                                </CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {template.type}
                                                    </Badge>
                                                    {template.isRequired && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Required
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openModal("view", template)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {!readonly && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => openModal("edit", template)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onSelect={(e) => e.preventDefault()}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete Template
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Variant Template</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete &quot;{template.name}&quot;?
                                                                        This action cannot be undone and will affect all
                                                                        products using this template.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(template.$id)}
                                                                        disabled={isDeleting && deletingId === template.$id}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        {isDeleting && deletingId === template.$id ? "Deleting..." : "Delete"}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {showScope && (
                                        <div className="flex items-center gap-2 mt-2">
                                            {isGlobal ? (
                                                <Badge variant="outline" className="text-xs">
                                                    <Globe className="w-3 h-3 mr-1" />
                                                    Global
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Store className="w-3 h-3 mr-1" />
                                                    Store
                                                </Badge>
                                            )}
                                            <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                                                {template.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    )}
                                </CardHeader>

                                <CardContent className="pt-0">
                                    {template.description && (
                                        <CardDescription className="text-sm mb-3 line-clamp-2">
                                            {template.description}
                                        </CardDescription>
                                    )}

                                    <div className="space-y-3">
                                        {optionsCount > 0 && (
                                            <div>
                                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                                    Options ({optionsCount})
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {template.options?.slice(0, 3).map((option: any, index: number) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {template.type === 'color' && option.hex ? (
                                                                <div className="flex items-center gap-1">
                                                                    <div
                                                                        className="w-2 h-2 rounded-full border"
                                                                        style={{ backgroundColor: option.hex }}
                                                                    />
                                                                    {option.label}
                                                                </div>
                                                            ) : (
                                                                option.label || option.value
                                                            )}

                                                            {optionsCount > 3 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{optionsCount - 3} more
                                                                </Badge>
                                                            )}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}


                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                            <span>
                                                {/* @ts-ignore */}
                                                {template.type === 'multiselect' && template.maxSelections && (
                                                    `Max: ${template.maxSelections}`
                                                )}
                                                {/* @ts-ignore */}
                                                {template.type === 'multiselect' && template.minSelections && (
                                                    `Min: ${template.minSelections}`
                                                )}
                                                {template.allowCustomValues && "Custom values allowed"}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {template.categoryIds && template.categoryIds.length > 0 && (
                                                    <span>{template.categoryIds.length} categories</span>
                                                )}
                                                {template.productTypeIds && template.productTypeIds.length > 0 && (
                                                    <span>{template.productTypeIds.length} product types</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => openModal("view", template)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                            {!readonly && (
                                                <Button
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => openModal("edit", template)}
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            <ResponsiveModal
                open={modalState.isOpen}
                onOpenChange={(open) => !open && closeModal()}
            >
                {modalState.type === "create" && (
                    <CreateTemplateModal
                        storeId={storeId}
                        // productTypeId={productTypeId}
                        onClose={closeModal}
                    />
                )}

                {modalState.type === "edit" && modalState.template && (
                    <EditTemplateModal
                        template={modalState.template}
                        storeId={storeId}
                        onClose={closeModal}
                    />
                )}

                {modalState.type === "view" && modalState.template && (
                    <ViewTemplateModal
                        template={modalState.template}
                        onClose={closeModal}
                        onEdit={() => openModal("edit", modalState.template)}
                        readonly={readonly}
                    />
                )}
            </ResponsiveModal>
        </>
    )
}