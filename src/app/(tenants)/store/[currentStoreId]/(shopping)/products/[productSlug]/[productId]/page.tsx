import { NoItemsCard } from '@/components/no-items-card';
import SpinningLoader from '@/components/spinning-loader';
import { ProductDetails } from '@/features/products/components/product-details';
import { getVirtualProductById } from '@/lib/actions/affiliate-product-actions';
import { MAIN_DOMAIN } from '@/lib/env-config';
import React, { Suspense } from 'react';
import { ProductDetailsWrapper } from './product-details-wrapper';

interface PageProps {
    params: Promise<{ productId: string }>;
    searchParams: Promise<{ color?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
    const { productId } = await params;
    const { color } = await searchParams;

    try {
        const product = await getVirtualProductById(productId);
        if (!product) {
            return {
                title: 'Product Not Found',
                description: 'The requested product could not be found.',
            };
        }

        const selectedColor = color ? product.colors?.find(c =>
            c.colorName.toLowerCase().replace(/\s+/g, '-') === color.toLowerCase()
        ) : null;

        const baseUrl = MAIN_DOMAIN;
        const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const productUrl = `${baseUrl}/products/${productId}${color ? `?color=${color}` : ''}`;

        const title = selectedColor
            ? `${product.name} - ${selectedColor.colorName}`
            : product.name;

        const description = selectedColor
            ? `${product.name} in ${selectedColor.colorName}. ${product.shortDescription || product.description?.substring(0, 120)}`
            : product.shortDescription || product.description?.substring(0, 160);

        const images = selectedColor?.images?.length
            ? selectedColor.images
            : product.images || [];

        return {
            title,
            description,
            keywords: product.tags?.join(', ') || 'product, online shopping',
            openGraph: {
                title,
                description,
                url: productUrl,
                images: images.slice(0, 4).map(img => ({
                    url: img,
                    width: 600,
                    height: 600,
                    alt: `${product.name}${selectedColor ? ` - ${selectedColor.colorName}` : ''}`,
                })),
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: images[0] ? [images[0]] : [],
            },
            alternates: {
                canonical: productUrl,
            },
        }
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Product Details',
            description: 'View product details and specifications.',
        };
    }
}

export default async function ProductPage({ params, searchParams }: PageProps) {
    const { productId } = await params;
    const { color } = await searchParams;

    let initialProduct = null;

    try {
        initialProduct = await getVirtualProductById(productId);
    } catch (error) {
        console.error('Error fetching product:', error);
    }

    if (!initialProduct) {
        return <NoItemsCard title="Product Not Found" description="The product you're looking for doesn't exist or has been removed." />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<SpinningLoader />}>
                <ProductDetailsWrapper
                    productId={productId}
                    initialProduct={initialProduct}
                    initialColorParam={color}
                />
            </Suspense>
        </div>
    );
}