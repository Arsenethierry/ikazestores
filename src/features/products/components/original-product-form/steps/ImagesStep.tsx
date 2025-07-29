import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CreateProductSchema } from "@/lib/schemas/products-schems";
import { Images } from "lucide-react";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import z from "zod";

type ProductFormData = z.infer<typeof CreateProductSchema>;

interface ImagesStepProps {
    form: UseFormReturn<ProductFormData>;
    previewImages: string[];
}
export const ImagesStep: React.FC<ImagesStepProps> = ({
    form,
    previewImages
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Upload high-quality images of your product. These will be the main product gallery.
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
    )
}