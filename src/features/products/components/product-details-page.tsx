import { VirtualProductTypes } from '@/lib/types';
import { ProductImagesZoomComponent } from './product-images-zoom-component';
import DOMPurify from "isomorphic-dompurify";
import { Suspense } from 'react';
import SpinningLoader from '@/components/spinning-loader';

export const ProductDetails = ({ product }: { product: VirtualProductTypes, }) => {
    const productDesc = DOMPurify.sanitize(product.description, { USE_PROFILES: { html: true } });

    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='flex flex-col md:flex-row gap-8 relative min-h-screen'>
                <div className='md:w-1/2 lg:w-2/5'>
                    <Suspense fallback={<SpinningLoader />}>
                        <ProductImagesZoomComponent
                            productImages={product.generalImageUrls}
                            productTitle={product.title}
                        />
                    </Suspense>
                </div>
                <div className="product-info md:w-1/2 lg:w-3/5">
                    <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
                    <div className="space-y-4" dangerouslySetInnerHTML={{ __html: productDesc }}></div>
                    {/* Add more product info sections to create scrollable content */}
                    <div className="mt-8 space-y-6">
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-lg">Specifications</h3>
                            {/* Specifications content */}
                        </div>
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-lg">Reviews</h3>
                            {/* Reviews content */}
                        </div>
                        {/* More sections as needed */}
                    </div>
                </div>
            </div>
        </div>
    );
}