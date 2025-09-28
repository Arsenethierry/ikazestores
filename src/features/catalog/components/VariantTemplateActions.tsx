'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, MoreHorizontal, Settings } from 'lucide-react';
import { useRemoveVariantFromProductType } from '@/hooks/queries-and-mutations/use-catalog-actions';
import { useConfirm } from '@/hooks/use-confirm';
import AssignVariantModal from './assign-variant-modal';

interface VariantTemplateActionsProps {
    productTypeId: string;
    assignmentId?: string;
    variantTemplateId?: string;
    showRemoveOnly?: boolean;
}

export function VariantTemplateActions({ 
    productTypeId, 
    assignmentId, 
    variantTemplateId,
    showRemoveOnly = false 
}: VariantTemplateActionsProps) {
    const [showAssignModal, setShowAssignModal] = useState(false);
    
    const { execute: removeVariant } = useRemoveVariantFromProductType();
    const [ConfirmDialog, confirm] = useConfirm(
        "Remove Variant Assignment",
        "Are you sure you want to remove this variant template from this product type?",
        "destructive"
    );

    const handleRemove = async () => {
        if (!variantTemplateId) return;
        
        const confirmed = await confirm();
        if (confirmed) {
            removeVariant({
                productTypeId,
                variantTemplateId
            });
        }
    };

    if (showRemoveOnly) {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure Options
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={handleRemove}
                            className="text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Assignment
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ConfirmDialog />
            </>
        );
    }

    return (
        <>
            <Button onClick={() => setShowAssignModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Assign Template
            </Button>

            {showAssignModal && (
                <AssignVariantModal
                    productTypeId={productTypeId}
                    open={showAssignModal}
                    onOpenChange={setShowAssignModal}
                    onSuccess={() => {
                        setShowAssignModal(false);
                    }}
                />
            )}
            
            <ConfirmDialog />
        </>
    );
}