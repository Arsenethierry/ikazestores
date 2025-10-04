"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Pencil, Package, Tag } from "lucide-react";
import type { PhysicalStoreTypes } from "@/lib/types";
import { CreateProductSchema } from "@/lib/schemas/products-schems";

type Category = { id: string; name: string };
type ProductType = { id: string; name: string };

interface ReviewStepProps {
  form: UseFormReturn<CreateProductSchema>;
  storeData: PhysicalStoreTypes;
  previewImages: string[];
  onGoToStep?: (step: number) => void;

  // Made optional to match the way you call <ReviewStep />
  categories?: Category[];
  productTypes?: ProductType[];
  selectedCategory?: string;
  selectedProductType?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  form,
  storeData,
  previewImages,
  onGoToStep,
  categories,
  productTypes,
  selectedCategory,
  selectedProductType,
}) => {
  const values = form.getValues();

  const categoryId = selectedCategory ?? values.categoryId;
  const productTypeId = selectedProductType ?? values.productTypeId;

  const categoryName =
    categories?.find((c) => c.id === categoryId)?.name ||
    categoryId ||
    "Not selected";
  const productTypeName =
    productTypes?.find((p) => p.id === productTypeId)?.name ||
    productTypeId ||
    "Not selected";

  const totalCombinations = values.productCombinations?.length || 0;
  const defaultCombination =
    values.productCombinations?.find((c) => c.isDefault) ?? null;

  const totalColorVariants = values.colorVariants?.length || 0;
  const defaultColor =
    values.colorVariants?.find((c) => c.isDefault)?.colorName || null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Summary</CardTitle>
          {onGoToStep && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGoToStep(1)}
                title="Edit Basic Info"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Basic Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGoToStep(2)}
                title="Edit Category"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Category
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGoToStep(3)}
                title="Edit Variants"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Variants
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGoToStep(4)}
                title="Edit Images & Colors"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Images & Colors
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Basic Info</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{values.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SKU</p>
                <p className="font-medium">{values.sku || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Base Price</p>
                <p className="font-medium">
                  {values.basePrice} {values.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline" className="font-medium">
                  {values.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Featured</p>
                {values.featured ? (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dropshipping</p>
                {values.isDropshippingEnabled ? (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap">{values.description}</p>
            </div>
          </section>

          <Separator />

          {/* Category */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Category</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{categoryName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subcategory</p>
                <p className="font-medium">
                  {values.subcategoryId || "Not selected"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Product Type</p>
                <p className="font-medium">{productTypeName}</p>
              </div>
            </div>
            {!!values.tags?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {values.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Variants & Combinations */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Variants</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  {values.hasVariants ? "Has variants" : "No variants"}
                </Badge>
                {!!totalCombinations && (
                  <Badge>{totalCombinations} combinations</Badge>
                )}
              </div>

              {values.hasVariants && (
                <>
                  {!!values.variants?.length && (
                    <div className="space-y-2">
                      {values.variants
                        .filter((v) => v?.values?.length)
                        .map((v) => (
                          <div key={v.templateId}>
                            <p className="text-sm font-medium">{v.name}</p>
                            <div className="text-xs text-muted-foreground">
                              {v.values
                                .map((opt) => opt.label || opt.value)
                                .join(", ")}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {!!values.productCombinations?.length && (
                    <div className="mt-2 rounded-md border p-3">
                      <p className="text-xs font-medium mb-2">Combinations</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {values.productCombinations.slice(0, 10).map((c) => (
                          <div
                            key={c.sku}
                            className="rounded border p-2 text-sm space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{c.sku}</span>
                              {c.isDefault && (
                                <Badge className="h-5 py-0">Default</Badge>
                              )}
                            </div>
                            {!!c.variantStrings?.length && (
                              <div className="text-xs text-muted-foreground">
                                {c.variantStrings.join(" • ")}
                              </div>
                            )}
                            <div className="text-xs">
                              Price: {c.basePrice} {values.currency} · Stock:{" "}
                              {c.stockQuantity ?? 0}
                            </div>
                          </div>
                        ))}
                      </div>
                      {values.productCombinations.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Showing first 10…
                        </p>
                      )}
                    </div>
                  )}

                  {defaultCombination && (
                    <p className="text-xs text-muted-foreground">
                      Default selection:{" "}
                      <span className="font-medium">{defaultCombination.sku}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          <Separator />

          {/* Images & Colors */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Images & Colors</h3>

            {!!previewImages.length && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {previewImages.slice(0, 8).map((src, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={idx}
                    src={src}
                    alt={`preview-${idx}`}
                    className="h-24 w-full object-cover rounded-md border"
                  />
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline">
                Colors: {values.enableColors ? "Enabled" : "Disabled"}
              </Badge>
              {values.enableColors && !!totalColorVariants && (
                <Badge>{totalColorVariants} color(s)</Badge>
              )}
              {values.enableColors && defaultColor && (
                <Badge variant="secondary">Default: {defaultColor}</Badge>
              )}
            </div>
          </section>

          <Separator />

          {/* Store */}
          <section>
            <h3 className="font-semibold text-sm mb-3">Store</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Store</p>
                <p className="font-medium">{storeData?.storeName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Country</p>
                <p className="font-medium">{values.storeCountry}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">
                  {values.storeLatitude}, {values.storeLongitude}
                </p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};
