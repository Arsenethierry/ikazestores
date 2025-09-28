import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VariantTemplatesListContainer, VariantTemplatesListSkeleton } from '@/features/catalog/variant-templates-list-container';
import { getCatalogVariantTemplates } from '@/lib/actions/catalog-server-actions';
import CreateVariantTemplateModal from '@/features/catalog/components/create-variant-template-modal';

interface VariantTemplatesPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        includeInactive?: string;
    }>;
}

export default async function VariantTemplatesPage({ searchParams }: VariantTemplatesPageProps) {
    const page = parseInt((await searchParams).page || '1');
  const search = (await searchParams).search;
  const includeInactive = (await searchParams).includeInactive === 'true';

  const templatesResponse = await getCatalogVariantTemplates({
      page,
      search,
      includeInactive,
      limit: 25,
  });

   if (!templatesResponse.success || !templatesResponse.data) {        
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

              <div className="text-red-500">
                  Error loading variant templates: {templatesResponse.error || 'Unknown error'}
              </div>
          </div>
      );
  }

  const templatesData = templatesResponse.data;

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
        <VariantTemplatesListContainer initialData={templatesData} />
      </Suspense>
    </div>
  )
}