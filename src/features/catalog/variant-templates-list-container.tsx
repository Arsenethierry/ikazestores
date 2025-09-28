'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/components/ui/multiselect";
import { useDeleteVariantTemplate } from "@/hooks/queries-and-mutations/use-catalog-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { CatalogVariantTemplates } from "@/lib/types/appwrite/appwrite";
import { Edit, Eye, EyeOff, Palette, MoreHorizontal, Search, Trash2, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import EditVariantTemplateModal from "./components/edit-variant-template-modal";
import ManageVariantOptionsModal from "./components/manage-variant-options-modal";

interface VariantTemplateItemProps {
    template: CatalogVariantTemplates;
    onEdit: (template: any) => void;
    onDelete: (templateId: string) => void;
    onManageOptions: (template: any) => void;
}

const VariantTemplateItem = React.memo<VariantTemplateItemProps>(({
    template,
    onEdit,
    onDelete,
    onManageOptions
}) => {
    const getInputTypeLabel = (inputType: string) => {
        const types: Record<string, string> = {
            text: 'Text Input',
            color: 'Color Picker',
            range: 'Range Slider',
            number: 'Number Input',
            select: 'Single Select',
            multiselect: 'Multi Select',
            boolean: 'Toggle Switch',
        };
        return types[inputType] || inputType;
    };

    return (
        <Card className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Palette className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{template.variantTemplateName}</CardTitle>
                            <CardDescription className="line-clamp-1">
                                {template.description || 'No description'}
                            </CardDescription>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {getInputTypeLabel(template.inputType)}
                                </Badge>
                                {template.isRequired && (
                                    <Badge variant="secondary" className="text-xs">Required</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? (
                                <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Active
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Inactive
                                </>
                            )}
                        </Badge>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onManageOptions(template)}
                        >
                            <Settings className="h-4 w-4 mr-1" />
                            Options
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(template)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Template
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onManageOptions(template)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Manage Options
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(template.$id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Template
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
})

VariantTemplateItem.displayName = 'VariantTemplateItem';

interface VariantTemplatesListContainerProps {
    initialData: {
        documents: CatalogVariantTemplates[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export function VariantTemplatesListContainer({ initialData }: VariantTemplatesListContainerProps) {
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [managingOptionsTemplate, setManagingOptionsTemplate] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const { execute: deleteTemplate } = useDeleteVariantTemplate();
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Variant Template",
        "Are you sure you want to delete this variant template? This will also delete all its options and remove it from any assigned product types. This action cannot be undone.",
        "destructive"
    );

    const filteredTemplates = useMemo(() => {
        if (!debouncedSearchTerm) return initialData.documents;

        return initialData.documents.filter(template =>
            template.variantTemplateName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            template.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [initialData.documents, debouncedSearchTerm]);

    React.useEffect(() => {
        if (debouncedSearchTerm) {
            const params = new URLSearchParams(searchParams);
            params.set('search', debouncedSearchTerm);
            router.push(`?${params.toString()}`, { scroll: false });
        } else {
            const params = new URLSearchParams(searchParams);
            params.delete('search');
            router.push(`?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearchTerm, searchParams, router]);

    const handleEdit = useCallback((template: any) => {
        setEditingTemplate(template);
    }, []);

    const handleManageOptions = useCallback((template: any) => {
        setManagingOptionsTemplate(template);
    }, []);

    const handleDelete = useCallback(async (templateId: string) => {
        const confirmed = await confirm();
        if (confirmed) {
            deleteTemplate({ templateId });
        }
    }, [confirm, deleteTemplate]);

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search variant templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Badge variant="outline" className="whitespace-nowrap">
                    {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
                </Badge>
            </div>

            {filteredTemplates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Palette className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No variant templates found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm ? 'No templates match your search.' : 'Get started by creating your first variant template.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredTemplates.map((template) => (
                        <VariantTemplateItem
                            key={template.$id}
                            template={template}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onManageOptions={handleManageOptions}
                        />
                    ))}
                </div>
            )}

            {editingTemplate && (
                <Suspense fallback={null}>
                    <EditVariantTemplateModal
                        template={editingTemplate}
                        open={!!editingTemplate}
                        onOpenChange={() => setEditingTemplate(null)}
                    />
                </Suspense>
            )}

            {managingOptionsTemplate && (
                <Suspense fallback={null}>
                    <ManageVariantOptionsModal
                        template={managingOptionsTemplate}
                        open={!!managingOptionsTemplate}
                        onOpenChange={() => setManagingOptionsTemplate(null)}
                    />
                </Suspense>
            )}

            <ConfirmDialog />
        </div>
    )
}

export function VariantTemplatesListSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                                    <div className="h-3 bg-muted rounded w-48 animate-pulse" />
                                    <div className="flex space-x-2">
                                        <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                                        <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
                                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}
