import CustomFormField, { FormFieldType } from "@/components/custom-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories } from "@/features/variants management/ecommerce-catalog";
import { productFormSchema } from "@/lib/schemas/products-schems";
import { Control } from "react-hook-form";
import z from "zod";

interface BasicInfoStepProps {
    control: Control<z.infer<typeof productFormSchema>>;
    selectedCategory: string;
    onGenerateSKU: () => void;
};

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
    control,
    selectedCategory,
    onGenerateSKU
}) => {
    const categories = getCategories();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomFormField
                            fieldType={FormFieldType.INPUT}
                            control={control}
                            name="name"
                            label="Product Name"
                            placeholder="Enter product name"
                        />
                        <div className="flex gap-2">
                            <CustomFormField
                                fieldType={FormFieldType.INPUT}
                                control={control}
                                name="sku"
                                label="SKU"
                                placeholder="Product SKU"
                            />
                            <Button type="button" variant="outline" onClick={onGenerateSKU} className="mt-8">
                                Generate
                            </Button>
                        </div>
                    </div>

                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={control}
                        name="description"
                        label="Description"
                        placeholder="Detailed product description"
                    />

                    <CustomFormField
                        fieldType={FormFieldType.TEXTAREA}
                        control={control}
                        name="shortDescription"
                        label="Short Description (Optional)"
                        placeholder="Brief product summary"
                    />

                    <CustomFormField
                        fieldType={FormFieldType.NUMBER_INPUT}
                        control={control}
                        name="basePrice"
                        label="Base Price"
                        placeholder="0.00"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Physical Properties & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={control}
                            name="weight"
                            label="Weight (kg)"
                            placeholder="0.0"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={control}
                            name="dimensions.length"
                            label="Length (cm)"
                            placeholder="0"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={control}
                            name="dimensions.width"
                            label="Width (cm)"
                            placeholder="0"
                        />
                        <CustomFormField
                            fieldType={FormFieldType.NUMBER_INPUT}
                            control={control}
                            name="dimensions.height"
                            label="Height (cm)"
                            placeholder="0"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center space-x-4 pt-8">
                            <FormField
                                control={control}
                                name="featured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Featured Product</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}