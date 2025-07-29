import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProductSchema } from "@/lib/schemas/products-schems";
import { PhysicalStoreTypes } from "@/lib/types";
import { Category, ProductType } from "@/lib/types/catalog-types";
import { CheckCircle, Images, Zap } from "lucide-react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import z from "zod";

type ProductFormData = z.infer<typeof CreateProductSchema>;

interface ReviewStepProps {
    form: UseFormReturn<ProductFormData>;
    storeData: PhysicalStoreTypes;
    categories: Category[];
    productTypes: ProductType[];
    selectedCategory: string;
    selectedProductType: string;
    previewImages: string[];
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
    form,
    storeData,
    categories,
    productTypes,
    selectedCategory,
    selectedProductType,
    previewImages
}) => {
    const combinationFields = form.watch('productCombinations') || [];
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Product Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Product Name:</span>
                                <p className="font-medium">{form.watch('name') || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">SKU:</span>
                                <p className="font-medium font-mono text-sm">{form.watch('sku') || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Base Price:</span>
                                <p className="font-medium text-lg">{form.watch('basePrice') || 0} {storeData.currency}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Category:</span>
                                <p className="font-medium">
                                    {categories.find(c => c.id === selectedCategory)?.name || 'Not selected'}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Product Type:</span>
                                <p className="font-medium">
                                    {productTypes.find(pt => pt.id === selectedProductType)?.name || 'Not selected'}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Variants:</span>
                                <p className="font-medium">
                                    {form.watch('hasVariants') ?
                                        `${combinationFields.length} combinations` :
                                        'No variants'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${form.watch('status') === 'active' ? 'bg-green-500' :
                                        form.watch('status') === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                                        }`} />
                                    <p className="font-medium capitalize">{form.watch('status')}</p>
                                    {form.watch('featured') && (
                                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Dropshipping:</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${form.watch('isDropshippingEnabled') ? 'bg-green-500' : 'bg-gray-500'}`} />
                                    <p className="font-medium">
                                        {form.watch('isDropshippingEnabled') ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {form.watch('tags') && form.watch('tags')!.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {form.watch('tags')?.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {combinationFields.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-600" />
                            Product Combinations Preview
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            These combinations will be stored in the product_combinations collection with variant filter strings.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {combinationFields.map((combo, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm">Combination {index + 1}:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">{combo.sku}</span>
                                            <span className="text-sm font-medium">{combo.basePrice} {storeData.currency}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {combo.variantStrings?.map((str, strIndex) => (
                                            <Badge key={strIndex} variant="secondary" className="text-xs">
                                                {str}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {previewImages.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Images className="h-5 w-5 text-purple-600" />
                            Image Gallery Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {previewImages.slice(0, 8).map((url, index) => (
                                <div key={index} className="relative">
                                    <Image
                                        src={url}
                                        width={150}
                                        height={150}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg border shadow-sm"
                                    />
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                            {previewImages.length > 8 && (
                                <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg border">
                                    <span className="text-sm text-muted-foreground">
                                        +{previewImages.length - 8} more
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}