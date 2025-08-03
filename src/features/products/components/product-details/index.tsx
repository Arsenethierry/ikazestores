"use client";

import DOMPurify from "isomorphic-dompurify";
import { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import SpinningLoader from '@/components/spinning-loader';
import { VirtualProductTypes } from '@/lib/types';
import { ProductViewer } from '@/hooks/queries-and-mutations/use-recently-viewed-products';
import { ProductImagesZoomComponent } from "../product-images-zoom-component";
import { ProductDescription } from "../product-description";
import { ArrowLeft, Star } from "lucide-react";
import { ProductColorsViewer } from "./product-colors-viewer";
import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductColors } from "@/lib/types/appwrite/appwrite";
import { ProductPriceDisplay } from "../../currency/converted-price-component";

interface ProductDetailsProps {
    product: VirtualProductTypes;
    initialColorParam?: string;
}

export const ProductDetails = ({ product, initialColorParam }: ProductDetailsProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const initialSelectedColor = useMemo(() => {
        if (initialColorParam && product.colors) {
            const colorFromUrl = product.colors.find(color =>
                color.colorName.toLowerCase().replace(/\s+/g, '-') === initialColorParam.toLowerCase()
            );
            if (colorFromUrl) return colorFromUrl;
        }
        return product.colors?.find(color => color.isDefault) || product.colors?.[0] || null;
    }, [product.colors, initialColorParam]);

    const [selectedColor, setSelectedColor] = useState<ProductColors | null>(initialSelectedColor);
    const [previewColor, setPreviewColor] = useState<ProductColors | null>(null);

    const [displayImages, setDisplayImages] = useState(() => {
        if (initialSelectedColor?.images && initialSelectedColor.images.length > 0) {
            return initialSelectedColor.images;
        }
        return product.images || [];
    });

    const updateUrlWithColor = useCallback((color: ProductColors | null) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        if (color) {
            const colorSlug = color.colorName.toLowerCase().replace(/\s+/g, '-');
            current.set('color', colorSlug);
        } else {
            current.delete('color');
        }

        const search = current.toString();
        const query = search ? `?${search}` : '';

        startTransition(() => {
            router.replace(`${pathname}${query}`, { scroll: false });
        });
    }, [pathname, router, searchParams, startTransition]);

    const handleColorSelect = useCallback((color: ProductColors) => {
        setSelectedColor(color);
        setPreviewColor(null);

        const newImages = color.images && color.images.length > 0
            ? color.images
            : product.images || [];
        setDisplayImages(newImages);

        updateUrlWithColor(color);
    }, [product.images, updateUrlWithColor]);

    const handleColorHover = useCallback((color: ProductColors | null) => {
        setPreviewColor(color);

        if (color) {
            const previewImages = color.images && color.images.length > 0
                ? color.images
                : product.images || [];
            setDisplayImages(previewImages);
        } else {
            const selectedImages = selectedColor?.images && selectedColor.images.length > 0
                ? selectedColor.images
                : product.images || [];
            setDisplayImages(selectedImages);
        }
    }, [selectedColor, product.images]);

    const finalPrice = useMemo(() => {
        const basePrice = product.price;
        const colorPrice = selectedColor?.additionalPrice || 0;
        return basePrice + colorPrice;
    }, [product.price, selectedColor?.additionalPrice]);

    useEffect(() => {
        const colorParam = searchParams.get('color');

        if (colorParam && product.colors) {
            const colorFromUrl = product.colors.find(color =>
                color.colorName.toLowerCase().replace(/\s+/g, '-') === colorParam.toLowerCase()
            );

            if (colorFromUrl && colorFromUrl.$id !== selectedColor?.$id) {
                setSelectedColor(colorFromUrl);
                setPreviewColor(null);
                const newImages = colorFromUrl.images && colorFromUrl.images.length > 0
                    ? colorFromUrl.images
                    : product.images || [];
                setDisplayImages(newImages);
            }
        } else if (!colorParam && selectedColor) {
            const defaultColor = product.colors?.find(color => color.isDefault) || product.colors?.[0] || null;
            if (defaultColor && defaultColor.$id !== selectedColor.$id) {
                setSelectedColor(defaultColor);
                setPreviewColor(null);
                const newImages = defaultColor?.images && defaultColor.images.length > 0
                    ? defaultColor.images
                    : product.images || [];
                setDisplayImages(newImages);
            }
        }
    }, [searchParams, product.colors, selectedColor?.$id, product.images]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center space-x-2 text-sm">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </button>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Electronics</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">Smartphones</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900 font-medium truncate">
                            {product.name}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        {displayImages.length > 0 && (
                            <ProductImagesZoomComponent
                                product={product}
                                productImages={displayImages}
                                productTitle={`${product.name}${(previewColor || selectedColor) ? ` - ${(previewColor || selectedColor)?.colorName}` : ''}`}
                                key={`${selectedColor?.$id || 'default'}-${previewColor?.$id || 'none'}`}
                            />
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                                    {product.name}
                                </h1>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                        <span className="ml-2 text-sm font-medium">4.5</span>
                                    </div>
                                    <span className="text-sm text-gray-600">(2,811 ratings)</span>
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                        #1 Best Seller
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>SKU: {product.sku}</span>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600 font-medium">In Stock</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                    <span className="text-xl font-bold text-gray-900">
                                        <ProductPriceDisplay
                                            productPrice={finalPrice}
                                            productCurrency={product.currency}
                                        />
                                    </span>
                                    {/* {selectedColor?.additionalPrice && selectedColor.additionalPrice > 0 && (
                                        <span className="text-lg text-gray-500 line-through">
                                            <ProductPriceDisplay
                                                productPrice={product.price}
                                                productCurrency={product.currency}
                                            />
                                        </span>
                                    )}
                                    {selectedColor?.additionalPrice && selectedColor.additionalPrice !== 0 && (
                                        <div className="text-sm">
                                            <span className="text-gray-600">Color adjustment: </span>
                                            <span className={`font-medium ${selectedColor.additionalPrice > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {selectedColor.additionalPrice > 0 ? '+' : ''}${selectedColor.additionalPrice}
                                            </span>
                                        </div>
                                    )} */}
                                </div>

                            </div>

                            <div className="prose max-w-none">
                                <ProductDescription
                                    description={product.description}
                                    maxLength={700}
                                    truncate={true}
                                    expandable={true}
                                />
                            </div>

                            <Separator />

                            {product.colors && product.colors.length > 0 && (
                                <ProductColorsViewer
                                    colors={product.colors}
                                    selectedColor={selectedColor}
                                    previewColor={previewColor}
                                    onColorSelect={handleColorSelect}
                                    onColorHover={handleColorHover}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}