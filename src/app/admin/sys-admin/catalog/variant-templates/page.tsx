import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateVariantTemplateModal } from '@/features/catalog/components';

export default function VariantTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Variant Templates</h1>
          <p className="text-muted-foreground">
            Create reusable variant configurations for your products
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateVariantTemplateModal>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </CreateVariantTemplateModal>
        </div>
      </div>

      <Suspense fallback={<VariantTemplatesListSkeleton />}>
        <VariantTemplatesListContainer />
      </Suspense>
    </div>
  );
}