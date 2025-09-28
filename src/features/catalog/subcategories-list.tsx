'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Edit, Eye, EyeOff, MoreHorizontal, Package, Plus, Trash2, ArrowRight } from "lucide-react";
import React, { lazy, memo, Suspense, useCallback, useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useDeleteSubcategory } from "@/hooks/queries-and-mutations/use-catalog-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { getSubcategoriesByCategory } from "@/lib/actions/catalog-server-actions";
import { Skeleton } from "@/components/ui/skeleton";
import CreateSubcategoryModal from "./components/create-subcategory-modal";
import EditSubcategoryModal from "./components/edit-subcategory-modal";
import Link from "next/link";

const SubcategoryItem = memo<{
  subcategory: any;
  onEdit: (subcategory: any) => void;
  onDelete: (subcategoryId: string) => void;
}>(({
  subcategory,
  onEdit,
  onDelete
}) => {
  return (
    <Card className="ml-4 border-l-4 border-l-blue-200 transition-all hover:shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {subcategory.iconUrl && (
              <div className="relative w-8 h-8 rounded-md overflow-hidden bg-muted">
                <Image
                  src={subcategory.iconUrl}
                  alt={subcategory.subCategoryName}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{subcategory.subCategoryName}</CardTitle>
              <CardDescription className="text-sm line-clamp-1">
                {subcategory.description || 'No description'}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant={subcategory.isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {subcategory.isActive ? (
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
              asChild
              className="h-7 text-xs"
            >
              <Link href={`/admin/sys-admin/catalog/categories/${subcategory.categoryId}/subcategories/${subcategory.$id}`}>
                <Package className="w-3 h-3 mr-1" />
                Manage Product Types
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(subcategory)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Subcategory
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/catalog/categories/${subcategory.categoryId}/subcategories/${subcategory.$id}`}>
                    <Package className="h-4 w-4 mr-2" />
                    Manage Product Types
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(subcategory.$id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Subcategory
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
});

SubcategoryItem.displayName = 'SubcategoryItem';

interface SubcategoriesListProps {
  categoryId: string;
}

export default function SubcategoriesList({ categoryId }: SubcategoriesListProps) {
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { execute: deleteSubcategory } = useDeleteSubcategory();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Subcategory",
    "Are you sure you want to delete this subcategory? This action cannot be undone.",
    "destructive"
  );

  useEffect(() => {
    const loadSubcategories = async () => {
      try {
        setLoading(true);
        const result = await getSubcategoriesByCategory({ categoryId });
        if (result.success && result.data) {
          setSubcategories(result.data.documents || []);
        } else {
          setError(result.error || 'Failed to load subcategories');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subcategories');
      } finally {
        setLoading(false);
      }
    };

    loadSubcategories();
  }, [categoryId]);

  const refreshSubcategories = useCallback(async () => {
    try {
      const result = await getSubcategoriesByCategory({ categoryId });
      if (result.success && result.data) {
        setSubcategories(result.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to refresh subcategories:', err);
    }
  }, [categoryId]);

  const handleEdit = useCallback((subcategory: any) => {
    setEditingSubcategory(subcategory);
  }, []);

  const handleDelete = useCallback(async (subcategoryId: string) => {
    const confirmed = await confirm();
    if (confirmed) {
      deleteSubcategory({ subcategoryId });
      // Remove from local state on successful deletion
      // setSubcategories(prev => prev.filter(sub => sub.$id !== subcategoryId));
    }
  }, [confirm, deleteSubcategory]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="ml-4 border-l-4 border-l-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-7 w-7" />
                  <Skeleton className="h-7 w-7" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-4 p-3 text-sm text-destructive border border-destructive/20 rounded-md">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between ml-4">
        <p className="text-sm text-muted-foreground">
          {subcategories.length} {subcategories.length === 1 ? 'subcategory' : 'subcategories'}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCreateModal(true)}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Subcategory
        </Button>
      </div>

      {subcategories.length === 0 ? (
        <div className="ml-4 p-4 text-center border border-dashed rounded-md">
          <p className="text-sm text-muted-foreground mb-2">No subcategories yet</p>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Create First Subcategory
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {subcategories.map((subcategory) => (
            <SubcategoryItem
              key={subcategory.$id}
              subcategory={subcategory}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateSubcategoryModal
            categoryId={categoryId}
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onSuccess={refreshSubcategories}
          />
        </Suspense>
      )}

      {editingSubcategory && (
        <Suspense fallback={null}>
          <EditSubcategoryModal
            subcategory={editingSubcategory}
            open={!!editingSubcategory}
            onOpenChange={(open) => !open && setEditingSubcategory(null)}
          />
        </Suspense>
      )}

      <ConfirmDialog />
    </div>
  )
}