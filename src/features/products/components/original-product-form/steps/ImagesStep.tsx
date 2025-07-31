import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CreateProductSchema } from "@/lib/schemas/products-schems";
import { Images, Palette } from "lucide-react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import z from "zod";
import { ColorVariantManager } from "../color-variant-manager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

type ProductFormData = z.infer<typeof CreateProductSchema>;

interface ImagesStepProps {
    form: UseFormReturn<ProductFormData>;
    previewImages: string[];
}

export const ImagesStep: React.FC<ImagesStepProps> = ({
    form,
    previewImages
}) => {
    const enableColors = form.watch('enableColors') || false;
    const colorVariants = form.watch('colorVariants') || [];

    return (
        <div className="space-y-6">
            {/* Main Product Images */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Images className="h-5 w-5" />
                        Main Product Images
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Upload high-quality images that represent your product. These are the primary gallery images.
                    </p>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Images *</FormLabel>
                                <FormControl>
                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    field.onChange(files);
                                                }}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label htmlFor="image-upload" className="cursor-pointer">
                                                <Images className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                                <h3 className="text-lg font-medium mb-2">Upload Product Images</h3>
                                                <p className="text-muted-foreground mb-2">
                                                    Click to browse or drag and drop images here
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Supported: JPG, PNG, WebP • Max 10 files • 5MB each
                                                </p>
                                            </label>
                                        </div>

                                        {previewImages.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-3">Image Preview</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {previewImages.map((url, index) => (
                                                        <div key={index} className="relative group">
                                                            <Image
                                                                src={url}
                                                                width={200}
                                                                height={200}
                                                                alt={`Preview ${index + 1}`}
                                                                className="w-full h-32 object-cover rounded-lg border shadow-sm"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => {
                                                                    const files = Array.from(field.value || []);
                                                                    files.splice(index, 1);
                                                                    field.onChange(files);
                                                                }}
                                                            >
                                                                x
                                                            </Button>
                                                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Color Variants Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Product Color Variants
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add color variants with their specific images. Each color can have its own photo gallery.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <FormField
                                control={form.control}
                                name="enableColors"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    if (!checked) {
                                                        form.setValue('colorVariants', []);
                                                    }
                                                }}
                                                id="enable-colors"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Label htmlFor="enable-colors">Enable Colors</Label>
                        </div>
                    </div>
                </CardHeader>

                {!enableColors && (
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="font-medium">Colors Disabled</h3>
                            <p className="text-sm">Enable colors to add color variants with specific images</p>
                        </div>
                    </CardContent>
                )}

                {enableColors && (
                    <CardContent>
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Color variants with images:</strong> Each color should have its own set of images 
                                showing the product in that specific color. This allows customers to see exactly how 
                                the product looks in each available color option.
                            </AlertDescription>
                        </Alert>
                        
                        <ColorVariantManager control={form.control} />
                    </CardContent>
                )}
            </Card>

            {/* Summary Information */}
            {(previewImages.length > 0 || colorVariants.length > 0) && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Images & Colors Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Images className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-green-900">Main Product Images</span>
                                <Badge variant="secondary">{previewImages.length}</Badge>
                            </div>
                            <p className="text-xs text-green-600 ml-6">
                                {previewImages.length > 0 
                                    ? `${previewImages.length} main product images uploaded`
                                    : "No main images uploaded yet"
                                }
                            </p>
                        </div>
                        
                        {enableColors && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-green-900">Color Variants</span>
                                    <Badge variant="secondary">{colorVariants.length}</Badge>
                                </div>
                                <p className="text-xs text-green-600 ml-6">
                                    {colorVariants.length > 0
                                        ? `${colorVariants.length} color variants configured`
                                        : "No color variants configured yet"
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Best Practices:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li><strong>Main images:</strong> Show the product from multiple angles, features, and in use</li>
                        <li><strong>Color variants:</strong> Each color should have images showing the product in that specific color</li>
                        <li><strong>Image quality:</strong> Use high-resolution images (at least 1000px wide) for best results</li>
                        <li><strong>Consistency:</strong> Try to use similar lighting and angles across all product images</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
};