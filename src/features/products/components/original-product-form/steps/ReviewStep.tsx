import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreateProductSchema } from "@/lib/schemas/products-schems";
import { PhysicalStoreTypes } from "@/lib/types";
import { Category, ProductType } from "@/lib/types/catalog-types";
import { CheckCircle, Images, Zap, AlertTriangle, ArrowLeft, ExternalLink, Package, Settings, Palette } from "lucide-react";
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
    onGoToStep?: (step: number) => void; // Add this prop to navigate to specific steps
}

// Helper function to get step number for field names
const getStepForField = (fieldName: string): number => {
    const stepMapping: Record<string, number> = {
        // Step 1 - Basic Info
        'name': 1,
        'description': 1,
        'shortDescription': 1,
        'sku': 1,
        'basePrice': 1,
        'currency': 1,
        'status': 1,
        'featured': 1,
        
        // Step 2 - Category
        'categoryId': 2,
        'subcategoryId': 2,
        'productTypeId': 2,
        'tags': 2,
        
        // Step 3 - Variants
        'hasVariants': 3,
        'variants': 3,
        'productCombinations': 3,
        
        // Step 4 - Images & Colors
        'images': 4,
        'enableColors': 4,
        'colorVariants': 4,
        'hasColorVariants': 4,
    };
    
    return stepMapping[fieldName] || 5;
};

// Helper function to get user-friendly field names
const getFieldDisplayName = (fieldName: string): string => {
    const fieldNames: Record<string, string> = {
        'name': 'Product Name',
        'description': 'Description',
        'shortDescription': 'Short Description',
        'sku': 'SKU',
        'basePrice': 'Base Price',
        'currency': 'Currency',
        'status': 'Status',
        'featured': 'Featured',
        'categoryId': 'Category',
        'subcategoryId': 'Subcategory',
        'productTypeId': 'Product Type',
        'tags': 'Tags',
        'hasVariants': 'Enable Variants',
        'variants': 'Product Variants',
        'productCombinations': 'Product Combinations',
        'images': 'Product Images',
        'enableColors': 'Enable Colors',
        'colorVariants': 'Color Variants',
        'hasColorVariants': 'Has Color Variants',
    };
    
    return fieldNames[fieldName] || fieldName;
};

// Helper function to get step icon
const getStepIcon = (step: number) => {
    const icons = {
        1: Package,
        2: Settings,
        3: Zap,
        4: Images,
        5: CheckCircle
    };
    return icons[step as keyof typeof icons] || Package;
};

// Helper function to get step name
const getStepName = (step: number): string => {
    const stepNames = {
        1: 'Basic Info',
        2: 'Category',
        3: 'Variants',
        4: 'Images & Colors',
        5: 'Review'
    };
    return stepNames[step as keyof typeof stepNames] || 'Unknown';
};

export const ReviewStep: React.FC<ReviewStepProps> = ({
    form,
    storeData,
    categories,
    productTypes,
    selectedCategory,
    selectedProductType,
    previewImages,
    onGoToStep
}) => {
    const combinationFields = form.watch('productCombinations') || [];
    const formErrors = form.formState.errors;
    
    // Process form errors into a more user-friendly format
    const processedErrors = Object.entries(formErrors).map(([fieldName, error]) => {
        const step = getStepForField(fieldName);
        const displayName = getFieldDisplayName(fieldName);
        let message = '';
        
        if (error && typeof error === 'object') {
            if ('message' in error && typeof error.message === 'string') {
                message = error.message;
            } else if (Array.isArray(error)) {
                // Handle array errors (like combinations)
                message = `Multiple issues found in ${displayName}`;
            } else {
                message = `Invalid ${displayName}`;
            }
        } else {
            message = `Invalid ${displayName}`;
        }
        
        return {
            field: fieldName,
            displayName,
            message,
            step,
            stepName: getStepName(step)
        };
    });
    
    // Group errors by step
    const errorsByStep = processedErrors.reduce((acc, error) => {
        if (!acc[error.step]) {
            acc[error.step] = [];
        }
        acc[error.step].push(error);
        return acc;
    }, {} as Record<number, typeof processedErrors>);
    
    const hasErrors = Object.keys(formErrors).length > 0;

    return (
        <div className="space-y-6">
            {/* Error Summary Card */}
            {hasErrors && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-5 w-5" />
                            Form Validation Errors ({processedErrors.length})
                        </CardTitle>
                        <p className="text-sm text-red-700">
                            Please fix the following errors before submitting your product:
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(errorsByStep).map(([stepNumber, stepErrors]) => {
                            const step = parseInt(stepNumber);
                            const StepIcon = getStepIcon(step);
                            
                            return (
                                <div key={step} className="border border-red-200 rounded-lg p-4 bg-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <StepIcon className="h-4 w-4 text-red-600" />
                                            <span className="font-medium text-red-800">
                                                Step {step}: {getStepName(step)}
                                            </span>
                                            <Badge variant="destructive" className="text-xs">
                                                {stepErrors.length} error{stepErrors.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                        {onGoToStep && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onGoToStep(step)}
                                                className="text-red-600 border-red-300 hover:bg-red-100"
                                            >
                                                <ArrowLeft className="h-3 w-3 mr-1" />
                                                Fix Errors
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {stepErrors.map((error, index) => (
                                            <Alert key={index} variant="destructive" className="py-2">
                                                <AlertTriangle className="h-3 w-3" />
                                                <AlertDescription className="text-sm">
                                                    <span className="font-medium">{error.displayName}:</span> {error.message}
                                                </AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Complete all required fields to enable product submission
                                </span>
                            </div>
                            {onGoToStep && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const firstErrorStep = Math.min(...Object.keys(errorsByStep).map(Number));
                                        onGoToStep(firstErrorStep);
                                    }}
                                    className="text-red-600 border-red-300 hover:bg-red-200"
                                >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Go to First Error
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Success Summary Card - Only show when no errors */}
            {!hasErrors && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            Product Ready for Submission ✅
                        </CardTitle>
                        <p className="text-sm text-green-700">
                            All required fields are completed. Your product is ready to be created!
                        </p>
                    </CardHeader>
                </Card>
            )}

            {/* Product Summary Card */}
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

            {/* Product Combinations Preview */}
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
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">Combination {index + 1}:</span>
                                            {combo.isDefault && (
                                                <Badge variant="default" className="text-xs">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
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

            {/* Color Variants Preview */}
            {form.watch('enableColors') && form.watch('colorVariants') && form.watch('colorVariants')!.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-purple-600" />
                            Color Variants Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {form.watch('colorVariants')?.map((color, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-4 h-4 rounded border"
                                            style={{ backgroundColor: color.colorCode }}
                                        />
                                        <span className="text-sm font-medium truncate">{color.colorName}</span>
                                        {color.isDefault && (
                                            <Badge variant="secondary" className="text-xs">Default</Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {color.images?.length || 0} image{(color.images?.length || 0) !== 1 ? 's' : ''}
                                        {color.additionalPrice && color.additionalPrice > 0 && (
                                            <span> • +{color.additionalPrice} {storeData.currency}</span>
                                        )}
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
    );
};