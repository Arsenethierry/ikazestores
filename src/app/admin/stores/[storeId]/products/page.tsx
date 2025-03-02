import { getOriginalProducts } from '@/features/products/actions/original-products-actions';
import ProductCard from '@/features/products/components/product-card';
import { DocumentType } from '@/lib/types';
import React from 'react';

async function StoreProductsPage() {
    const result = await getOriginalProducts();
    
    if (result === undefined) {
        return <p>Loading...</p>;
    }
    
    if (result.serverError) {
        return <p>Error: {result.serverError}</p>;
    }

    const products = result.data?.products;

    if (!products || !products.documents) {
        return <p>No products found</p>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.documents.map((product: DocumentType) => (
                <div key={product.$id}>
                    <ProductCard product={product} />
                </div>
            ))}
        </div>
    );
}

export default StoreProductsPage;