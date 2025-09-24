import { Skeleton } from "@/components/ui/skeleton";
import { CatalogLayoutWrapper } from "@/features/catalog/catalog-layout-wrapper";

interface CatalogLayoutProps {
    children: React.ReactNode;
}

export default function CatalogLayout({ children }: CatalogLayoutProps) {
  return (
    <CatalogLayoutWrapper fallback={<CatalogLayoutSkeleton />}>
      <div className="space-y-6">
        {children}
      </div>
    </CatalogLayoutWrapper>
  );
}

const CatalogLayoutSkeleton = () => (
    <div className="space-y-4">
        <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>
    </div>
);