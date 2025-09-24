'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/components/ui/multiselect";
import { useDeleteCategory } from "@/hooks/queries-and-mutations/use-catalog-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { ChevronRight, Edit, Eye, EyeOff, Folder, MoreHorizontal, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import SubcategoriesList from "../subcategories-list";
import EditCategoryModal from "./edit-category-modal";

interface CategoryItemProps {
    category: any;
    onEdit: (category: any) => void;
    onDelete: (categoryId: string) => void;
    onToggleSubcategories: (categoryId: string) => void;
    expandedCategories: Set<string>;
}

const CategoryItem = React.memo<CategoryItemProps>(({
    category,
    onEdit,
    onDelete,
    onToggleSubcategories,
    expandedCategories
}) => {
    const isExpanded = expandedCategories.has(category.$id);

    return (
        <Card className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {category.iconUrl && (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
                                <Image
                                    src={category.iconUrl}
                                    alt={category.categoryName}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                />
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-lg">{category.categoryName}</CardTitle>
                            <CardDescription className="line-clamp-1">
                                {category.description || 'No description'}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? (
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
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleSubcategories(category.$id)}
                        >
                            <ChevronRight
                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(category)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Category
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onToggleSubcategories(category.$id)}>
                                    <Folder className="h-4 w-4 mr-2" />
                                    {isExpanded ? 'Hide' : 'Show'} Subcategories
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(category.$id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Category
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0">
                    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading subcategories...</div>}>
                        <SubcategoriesList categoryId={category.$id} />
                    </Suspense>
                </CardContent>
            )}
        </Card>
    )
})

CategoryItem.displayName = 'CategoryItem';

interface CategoriesListContainerProps {
    initialData: {
        documents: any[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export function CategoriesListContainer({ initialData }: CategoriesListContainerProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const { execute: deleteCategory, isExecuting: isDeleting } = useDeleteCategory();
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Category",
        "Are you sure you want to delete this category? This action cannot be undone.",
        "destructive"
    );

    const filteredCategories = useMemo(() => {
        if (!debouncedSearchTerm) return initialData.documents;

        return initialData.documents.filter(category =>
            category.categoryName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            category.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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

    const handleToggleSubcategories = useCallback((categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    }, []);

    const handleEdit = useCallback((category: any) => {
        setEditingCategory(category);
    }, []);

    const handleDelete = useCallback(async (categoryId: string) => {
        const confirmed = await confirm();
        if (confirmed) {
            deleteCategory({ categoryId });
        }
    }, [confirm, deleteCategory]);

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Badge variant="outline" className="whitespace-nowrap">
                    {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
                </Badge>
            </div>

            {filteredCategories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm ? 'No categories match your search.' : 'Get started by creating your first category.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredCategories.map((category) => (
                        <CategoryItem
                            key={category.$id}
                            category={category}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleSubcategories={handleToggleSubcategories}
                            expandedCategories={expandedCategories}
                        />
                    ))}
                </div>
            )}

            {editingCategory && (
                <Suspense fallback={null}>
                    <EditCategoryModal
                        category={editingCategory}
                        open={!!editingCategory}
                        onOpenChange={() => setEditingCategory(null)}
                    />
                </Suspense>
            )}

            <ConfirmDialog />
        </div>
    )
}

export function CategoriesListSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                                    <div className="h-3 bg-muted rounded w-48 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
                                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}
