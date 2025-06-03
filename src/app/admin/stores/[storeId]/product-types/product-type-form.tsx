// app/admin/stores/[storeId]/product-types/product-type-form.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Info, Package, Save, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ProductTypeSchema, UpdateProductTypeSchema } from "@/lib/schemas/product-variants-schema";
import { createProductType, updateProductType } from "@/features/products/actions/variants management/product-types-actions";
import { CategoryTypes, ProductType, VariantTemplate } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ProductTypeFormProps {
  storeId: string;
  userId: string;
  mode: "create" | "edit";
  categories: CategoryTypes[];
  availableVariantTemplates: VariantTemplate[];
  initialData?: ProductType
}

export default function ProductTypeForm({
  availableVariantTemplates,
  categories,
  mode,
  storeId,
  userId,
  initialData
}: ProductTypeFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof ProductTypeSchema | typeof UpdateProductTypeSchema>>({
    resolver: zodResolver(mode === "create" ? ProductTypeSchema : UpdateProductTypeSchema),
    defaultValues: mode === "create"
      ? {
        name: "",
        description: "",
        categoryId: "",
        storeId: storeId,
        createdBy: userId,
        defaultVariantTemplates: [],
        isActive: true,
        sortOrder: 0,
      }
      : {
        productTypeId: initialData?.productTypeId || "",
        name: initialData?.name || "",
        description: initialData?.description || "",
        categoryId: initialData?.categoryId || "",
        defaultVariantTemplates: initialData?.defaultVariants || [],
        isActive: initialData?.isActive !== false,
        sortOrder: initialData?.sortOrder || 0,
      }
  });

  // Create action
  const { execute: executeCreate, isPending: isCreating } = useAction(createProductType, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.success);
        router.push(`${storeId ? `/admin/stores/${storeId}/product-types` : '/admin/product-types'}`);
      } else if (data?.error) {
        toast.error(data.error);
      }
    },
    onError: (error) => {
      console.error("Create product type error:", error);
      toast.error("Failed to create product type");
    },
  });

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateProductType, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.success);
        router.push(`/admin/stores/${storeId}/product-types`);
      } else if (data?.error) {
        toast.error(data.error);
      }
    },
    onError: (error) => {
      console.error("Update product type error:", error);
      toast.error("Failed to update product type");
    },
  });

  const isPending = isCreating || isUpdating;
  const selectedCategoryId = form.watch("categoryId");
  const selectedDefaultVariants = form.watch("defaultVariantTemplates") || [];

  const filteredVariantTemplates = availableVariantTemplates.filter(template =>
    !template.categoryIds ||
    template.categoryIds.length === 0 ||
    template.categoryIds.includes(selectedCategoryId)
  );

  function onSubmit(values: z.infer<typeof ProductTypeSchema | typeof UpdateProductTypeSchema>) {
    if (mode === "create") {
      executeCreate(values as z.infer<typeof ProductTypeSchema>);
    } else {
      executeUpdate(values as z.infer<typeof UpdateProductTypeSchema>);
    }
  }

  const selectedCategory = categories.find(cat => cat.$id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === "create" ? "Create Product Type" : "Edit Product Type"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Product types help organize and categorize your products for variant management."
              : "Make changes to this product type. Note that changes may affect associated variant templates."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <h3 className="text-lg font-medium">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., iPhone, Galaxy Series, MacBook Pro"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A specific name for this product type (e.g., &quot;iPhone&quot; not &quot;Smartphone&quot;)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.$id} value={category.$id}>
                                <div className="flex items-center gap-2">
                                  {/* {category.iconUrl && (
                                    <img src={category.iconUrl} alt="" className="w-4 h-4" />
                                  )} */}
                                  {category.categoryName}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The main category this product type belongs to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what products fall under this type..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide additional context about what products belong to this type
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedCategory && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Category:</strong> {selectedCategory.categoryName}
                      <br />
                      This product type will be available for products in the {selectedCategory.categoryName} category.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4" />
                    <h3 className="text-lg font-medium">Default Variant Templates</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select variant templates that should be automatically available for products of this type.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="defaultVariantTemplates"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          {filteredVariantTemplates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {filteredVariantTemplates.map((template) => (
                                <div
                                  key={template.$id}
                                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    id={template.$id}
                                    checked={field.value?.includes(template.$id)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), template.$id]
                                        : (field.value || []).filter((id) => id !== template.$id);
                                      field.onChange(newValue);
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <label
                                      htmlFor={template.$id}
                                      className="text-sm font-medium cursor-pointer block"
                                    >
                                      {template.name}
                                    </label>
                                    {template.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {template.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {template.type}
                                      </Badge>
                                      {template.isRequired && (
                                        <Badge variant="secondary" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                No variant templates available for this category. You can create variant templates after creating this product type.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Selected templates ({selectedDefaultVariants.length}) will be automatically available when creating products of this type.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first in lists
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Whether this product type is available for use
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {mode === "create" && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This product type will be created specifically for your store. You can later create additional variant templates that apply to this product type.
                  </AlertDescription>
                </Alert>
              )}

              {mode === "edit" && initialData && (
                <div className="space-y-3">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Changes to this product type may affect existing variant templates and products using this type.
                    </AlertDescription>
                  </Alert>

                  <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted rounded-lg">
                    <p><strong>Created:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Scope:</strong> {initialData.storeId ? "Store-specific" : "Global template"}</p>
                    <p><strong>Default Variants:</strong> {initialData.defaultVariants.length} templates</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/stores/${storeId}/product-types`)}
                  disabled={isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>

                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      {mode === "create" ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {mode === "create" ? "Create Product Type" : "Update Product Type"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}