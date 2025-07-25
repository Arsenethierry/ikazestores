"use client";

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CurrentUserType } from '@/lib/types';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { deleteCategoryById } from '../actions/categories-actions';

interface PageProps {
    categories: any[],
    isSystemAdmin: boolean,
    currentUser: CurrentUserType
}

export const AllCategories = ({
    categories,
    currentUser
}: PageProps) => {

    const [DeleteProductDialog, confirmDeleteProduct] = useConfirm(
        "Are you sure you want to delete this category?",
        "This action cannot be undone",
        "destructive"
    );

    const { executeAsync } = useAction(deleteCategoryById, {
        onSuccess: ({ data }) => {
            if (data?.success) {
                toast.success("Category deleted successfully")
            } else if (data?.error) {
                toast.error(data.error)
            }
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


    const canModify = (category: any) => currentUser!.$id === category.createdBy

    return (
        <Card>
            <DeleteProductDialog />
            <CardContent className='p-4 space-y-4'>
                {categories.map((category) => (
                    <div
                        key={category.$id}
                        className='flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg'
                    >
                        <div className='flex items-center gap-4'>
                            {(category.iconUrl && typeof category.iconUrl === 'string') && (
                                <Image
                                    src={category.iconUrl}
                                    alt={category.categoryName}
                                    width={100}
                                    height={100}
                                    className='h-10 w-10 object-cover rounded-full'
                                />
                            )}
                            <span className='font-medium'>{category.categoryName}</span>
                        </div>
                        {canModify(category) && (
                            <div className='flex items-center gap-2'>
                                <Link
                                    href={`/admin/categories/${category.$id}/edit`}
                                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                                >
                                    <Pencil className='h-4 w-4 mr-2' />
                                    Edit
                                </Link>
                                <Button
                                    variant='destructive'
                                    size='sm'
                                    onClick={() => handleDelete(category.$id)}
                                >
                                    <Trash2 className='h-4 w-4 mr-2' />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};