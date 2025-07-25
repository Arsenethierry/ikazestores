"use client";

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from './hooks/useProducts';
import { ProductCard } from './components/ProductCard';
import { ProductFilters } from './components/ProductFilters';
import { ProductPagination } from './components/ProductPagination';

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Amazon Products Catalog</h1>
      
      <ProductFilters />
      
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
      
      <Suspense fallback={<div className="mt-6 h-8" />}>
        <ProductPaginationWrapper />
      </Suspense>
    </div>
  );
}

function ProductGrid() {
  const { data } = useProducts()
  
  if (!data || !data.products || data.products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg">No products found. Try different filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {data.products.map((product: any) => (
        <ProductCard key={`${product.name}-${product.product_url}`} product={product} />
      ))}
    </div>
  );
}

function ProductPaginationWrapper() {
  const { data } = useProducts()
  return data?.total ? <ProductPagination total={data.total} /> : null;
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  );
}