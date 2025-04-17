"use client";

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CurrentUserType, SubCategoryTypes } from '@/lib/types';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { deleteSubcategoryById } from '../actions/sub-categories-actions';

interface PageProps {
    subcategories: SubCategoryTypes[],
    currentUser: CurrentUserType
}
export const AllSubCategories = ({
    subcategories,
    currentUser
}: PageProps) => {

    const [DeleteProductDialog, confirmDeleteProduct] = useConfirm(
        "Are you sure you want to delete this category?",
        "This action cannot be undone",
        "destructive"
    );

    const { executeAsync } = useAction(deleteSubcategoryById, {
        onSuccess: () => {
            toast.success("Category deleted successfully")
        },
        onError: ({ error }) => {
            toast.error(error.serverError)
        }
    })

    const handleDelete = async (categoryId: string) => {
        const ok = await confirmDeleteProduct();
        if (!ok) return;
        executeAsync({ categoryId })
    };

    const canDelete = (subCategory: SubCategoryTypes) => currentUser!.$id === subCategory.createdBy;

    return (
        <Card>
            <DeleteProductDialog />
            <CardContent className='p-4 space-y-4'>
                {subcategories.map((subCategory) => (
                    <div
                        key={subCategory.$id}
                        className='flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg'
                    >
                        <div className='flex items-center gap-4'>
                            {(subCategory.iconUrl && typeof subCategory.iconUrl === 'string') && (
                                <Image
                                    src={subCategory.iconUrl}
                                    alt={subCategory.subCategoryName}
                                    width={100}
                                    height={100}
                                    className='h-10 w-10 object-cover rounded-full'
                                />
                            )}
                            <span className='font-medium'>{subCategory.subCategoryName}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Link
                                href={`/admin/categories/${subCategory.$id}/edit`}
                                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                            >
                                <Pencil className='h-4 w-4 mr-2' />
                                Edit
                            </Link>
                            {canDelete(subCategory) && (
                                <Button
                                    variant='destructive'
                                    size='sm'
                                    onClick={() => handleDelete(subCategory.$id)}
                                >
                                    <Trash2 className='h-4 w-4 mr-2' />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};