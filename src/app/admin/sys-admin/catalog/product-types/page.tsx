import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProductTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
          <p className="text-muted-foreground">
            Define specific product types within your categories
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Product Type
          </Button>
        </div>
      </div>

      <Suspense fallback={<ProductTypesListSkeleton />}>
        <ProductTypesListContainer />
      </Suspense>
    </div>
  );
}