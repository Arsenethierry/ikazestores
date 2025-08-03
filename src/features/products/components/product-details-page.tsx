import { ProductImagesZoomComponent } from './product-images-zoom-component';
import DOMPurify from "isomorphic-dompurify";
import { Suspense } from 'react';
import SpinningLoader from '@/components/spinning-loader';
import { ProductViewer } from '../../../hooks/queries-and-mutations/use-recently-viewed-products';
import { AffiliateProductImports } from '@/lib/types/appwrite/appwrite';

export const ProductDetails = ({ product }: { product: AffiliateProductImports }) => {
    // const productDesc = DOMPurify.sanitize(product.description, { USE_PROFILES: { html: true } });

    return (
        <div className='container mx-auto px-4 py-8'>
            {JSON.stringify(product)}
            {/* <ProductViewer product={product} /> */}
            {/* <div className='flex flex-col md:flex-row gap-8 relative min-h-screen'>
                {product.generalImageUrls && (
                    <div className='md:w-1/2 lg:w-2/5'>
                        <Suspense fallback={<SpinningLoader />}>
                            <ProductImagesZoomComponent
                                productImages={product.generalImageUrls}
                                productTitle={product.title}
                            />
                        </Suspense>
                    </div>
                )}
                <div className="product-info md:w-1/2 lg:w-3/5">
                    <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
                    <div className="space-y-4" dangerouslySetInnerHTML={{ __html: productDesc }}></div>
                    <div className="mt-8 space-y-6">
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-lg">Specifications</h3>
                        </div>
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-lg">Reviews</h3>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
}