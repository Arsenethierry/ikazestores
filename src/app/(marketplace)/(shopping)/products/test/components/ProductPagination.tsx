'use client';

import { Button } from '@/components/ui/button';
import { useProductStore } from '../productStore';

export const ProductPagination = ({ total }: { total: number }) => {
    const { page, pageSize, setPage } = useProductStore();
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total} products
            </div>

            <div className="flex space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                >
                    Previous
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};