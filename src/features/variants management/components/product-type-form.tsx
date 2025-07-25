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
import { createProductType, updateProductType } from "@/features/categories/actions/product-types-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductTypeFormProps {
  storeId: string;
  userId: string;
  mode: "create" | "edit";
  categories: any[];
  initialData?: any
}

export default function ProductTypeForm({
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
        slug: "",
        description: "",
        categoryId: "",
        storeId: storeId,
        createdBy: userId,
      }
      : {
        productTypeId: initialData?.productTypeId || initialData?.$id || "",
        name: initialData?.name || "",
        description: initialData?.description || "",
        categoryId: initialData?.categoryId || "",
        isActive: initialData?.isActive !== false,
      }
  });
  
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
        router.push(`${storeId ? `/admin/stores/${storeId}/product-types` : '/admin/product-types'}`);
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

  // Auto-generate slug from name for create mode
  const handleNameChange = (value: string) => {
    if (mode === "create") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue("slug", slug);
    }
  };

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
              ? "Product types help organize and categorize your products for better management."
              : "Make changes to this product type. Note that changes may affect associated products."
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
                            onChange={(e) => {
                              field.onChange(e);
                              handleNameChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          A specific name for this product type (e.g., &quot;iPhone&quot; not &quot;Smartphone&quot;)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {mode === "create" && (
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., iphone, galaxy-series, macbook-pro"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            URL-friendly identifier (auto-generated from name)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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

              {mode === "edit" && (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </>
              )}

              {mode === "create" && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This product type will be created specifically for your store. You can later manage products under this type.
                  </AlertDescription>
                </Alert>
              )}

              {mode === "edit" && initialData && (
                <div className="space-y-3">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Changes to this product type may affect existing products using this type.
                    </AlertDescription>
                  </Alert>

                  <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted rounded-lg">
                    <p><strong>Created:</strong> {new Date(initialData.$createdAt || '').toLocaleDateString()}</p>
                    <p><strong>Scope:</strong> {initialData.storeId ? "Store-specific" : "Global template"}</p>
                    <p><strong>Category:</strong> {selectedCategory?.categoryName || 'Not selected'}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`${storeId ? `/admin/stores/${storeId}/product-types` : '/admin/product-types'}`)}
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