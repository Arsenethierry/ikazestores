import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { getCategories, getCategoryById, getProductTypesBySubcategory } from "@/features/variants management/ecommerce-catalog"
import { productFormSchema } from "@/lib/schemas/products-schems"
import {
    Category,
    ProductType,
    Subcategory,
    VariantTemplate
} from "@/lib/types/catalog-types"
import { Zap } from "lucide-react"
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form"
import z from "zod"

interface CategoryStepProps {
    control: Control<z.infer<typeof productFormSchema>>;
    setValue: UseFormSetValue<z.infer<typeof productFormSchema>>;
    watch: UseFormWatch<z.infer<typeof productFormSchema>>;
    selectedCategory: string;
    selectedSubcategory: string;
    selectedProductType: string;
    availableVariants: VariantTemplate[];
    currentTag: string;
    setCurrentTag: (tag: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onSubcategoryChange: (subcategoryId: string) => void;
    onProductTypeChange: (productTypeId: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tagToRemove: string) => void;
}

export const CategoryStep: React.FC<CategoryStepProps> = ({
    control,
    watch,
    selectedCategory,
    selectedSubcategory,
    selectedProductType,
    availableVariants,
    currentTag,
    setCurrentTag,
    onCategoryChange,
    onSubcategoryChange,
    onProductTypeChange,
    onAddTag,
    onRemoveTag
}) => {
    const categories = getCategories();
    const subcategories = selectedCategory ? getCategoryById(selectedCategory)?.subcategories || [] : [];
    const productTypes = (selectedCategory && selectedSubcategory) ? 
        getProductTypesBySubcategory(selectedCategory, selectedSubcategory) : [];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Product Classification</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Select the appropriate category to get intelligent variant suggestions
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={control}
                            name="categoryId"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={onCategoryChange} value={selectedCategory}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category: Category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="subcategoryId"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Subcategory</FormLabel>
                                    <Select
                                        onValueChange={onSubcategoryChange}
                                        value={selectedSubcategory}
                                        disabled={!selectedCategory}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select subcategory" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {subcategories.map((subcategory: Subcategory) => (
                                                <SelectItem key={subcategory.id} value={subcategory.id}>
                                                    {subcategory.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name="productTypeId"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Product Type</FormLabel>
                                    <Select
                                        onValueChange={onProductTypeChange}
                                        value={selectedProductType}
                                        disabled={!selectedSubcategory}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select product type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {productTypes.map((productType: ProductType) => (
                                                <SelectItem key={productType.id} value={productType.id}>
                                                    {productType.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {selectedProductType && availableVariants.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-blue-600" />
                                <h4 className="text-sm font-medium text-blue-900">
                                    Smart Variant Suggestions Ready
                                </h4>
                            </div>
                            <p className="text-xs text-blue-700 mb-3">
                                {availableVariants.length} relevant variants available for {productTypes.find(pt => pt.id === selectedProductType)?.name}. Configure them in the next step.
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {availableVariants.slice(0, 6).map(variant => (
                                    <Badge key={variant.id} variant="secondary" className="text-xs">
                                        {variant.name}
                                        {variant.isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </Badge>
                                ))}
                                {availableVariants.length > 6 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{availableVariants.length - 6} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            placeholder="Add a tag"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                        />
                        <Button type="button" onClick={onAddTag}>Add</Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {watch('tags')?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => onRemoveTag(tag)}
                                    className="ml-1 text-xs hover:text-red-500"
                                >
                                    ×
                                </button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}