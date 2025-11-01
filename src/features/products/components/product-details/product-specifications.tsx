import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VirtualProductTypes } from '@/lib/types';
import { Package, Ruler, Weight, Zap } from 'lucide-react';

interface ProductSpecificationsProps {
    product: VirtualProductTypes;
}

export const ProductSpecifications = ({ product }: ProductSpecificationsProps) => {
    const specifications: { label: string; value: string; icon?: any }[] = [];

    // Add basic specs
    specifications.push(
        { label: 'Brand', value: product.brandName || 'Generic', icon: Package },
        { label: 'Model', value: product.sku || 'N/A', icon: Package },
        { label: 'Condition', value: 'New', icon: Zap }
    );

    // Add variant-based specs
    if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
            if (variant.values && variant.values.length > 0) {
                specifications.push({
                    label: variant.name,
                    value: variant.values.map((v: any) => v.label || v.value).join(', '),
                });
            }
        });
    }

    if (product.productCombinations && product.productCombinations.length > 0) {
        const combo = product.productCombinations[0];
        if (combo.weight) {
            specifications.push({
                label: 'Weight',
                value: `${combo.weight} kg`,
                icon: Weight,
            });
        }
        if (combo.dimensions) {
            specifications.push({
                label: 'Dimensions',
                value: `${combo.dimensions.length}×${combo.dimensions.width}×${combo.dimensions.height} cm`,
                icon: Ruler,
            });
        }
    }

    const features = product.tags || [];

    return (
        <Card className="my-8">
            <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Key Features */}
                {features.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-3">Key Features</h3>
                        <div className="flex flex-wrap gap-2">
                            {features.map((feature, idx) => (
                                <Badge key={idx} variant="secondary">
                                    {feature}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Technical Specifications */}
                <div>
                    <h3 className="font-semibold mb-3">Technical Specifications</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {specifications.map((spec, idx) => {
                            const Icon = spec.icon;
                            return (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    {Icon && <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />}
                                    <div>
                                        <p className="text-sm font-medium">{spec.label}</p>
                                        <p className="text-sm text-muted-foreground">{spec.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* What's in the Box */}
                <Separator />
                <div>
                    <h3 className="font-semibold mb-3">What's in the Box</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {product.name} x1
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            User Manual
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            Warranty Card
                        </li>
                    </ul>
                </div>

                {/* Additional Info */}
                <Separator />
                <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                        <strong>SKU:</strong> {product.sku || 'N/A'}
                    </p>
                    {product.categoryNames && product.categoryNames.length > 0 && (
                        <p>
                            <strong>Category:</strong> {product.categoryNames.join(' > ')}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}