"use client";

import { FC, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, MapPin, Package, Search, X } from "lucide-react";
import type { ProductFilters } from "@/lib/types";

import {
  getCatalogCategories,
  getSubcategoriesByCategory,
  getProductTypesBySubcategory,
} from "@/lib/actions/catalog-server-actions";

type BasicItem = { id: string; name: string };
const catalogCache = {
  categories: null as BasicItem[] | null,
  subcategoriesByCategory: new Map<string, BasicItem[]>(),
  productTypesBySubcategory: new Map<string, BasicItem[]>(),
};

function normalizeId(v: any): string {
  return v?.id ?? v?.$id ?? v?.documentId ?? String(v);
}
function normalizeName(v: any): string {
  return (
    v?.name ??
    v?.categoryName ??
    v?.subcategoryName ??
    v?.productTypeName ??
    ""
  );
}
function toBasic(list: any[] | undefined | null): BasicItem[] {
  if (!Array.isArray(list)) return [];
  return list.map((v) => ({ id: normalizeId(v), name: normalizeName(v) }));
}

// ---- debounce helper for the search box ----
function useDebouncedCallback<T extends any[]>(
  cb: (...args: T) => void,
  delay = 400
) {
  // Works in both browser and Node typings
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always call the latest cb (avoid stale closure)
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  return (...args: T) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => cbRef.current(...args), delay);
  };
}

interface FiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  isLoading?: boolean;
}

export const ProductsFilters: FC<FiltersProps> = ({
  filters,
  onFiltersChange,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [isFetchingCats, setIsFetchingCats] = useState(false);
  const [isFetchingSubs, setIsFetchingSubs] = useState(false);
  const [isFetchingTypes, setIsFetchingTypes] = useState(false);
  const [_, startTransition] = useTransition();

  const [categories, setCategories] = useState<BasicItem[]>(
    catalogCache.categories ?? []
  );
  useEffect(() => {
    let active = true;
    (async () => {
      if (catalogCache.categories) return;
      setIsFetchingCats(true);
      const res = await getCatalogCategories({
        includeInactive: false,
        limit: 1000,
      });
      setIsFetchingCats(false);
      if (!active) return;
      const items = toBasic(res?.data?.documents ?? res?.data?.documents ?? []);
      catalogCache.categories = items;
      setCategories(items);
    })();
    return () => {
      active = false;
    };
  }, []);

  const [subcategories, setSubcategories] = useState<BasicItem[]>([]);
  useEffect(() => {
    let active = true;

    // Reset children when parent changes
    if (filters.categoryId === undefined) {
      setSubcategories([]);
      return;
    }

    const cached = catalogCache.subcategoriesByCategory.get(
      filters.categoryId!
    );
    if (cached) {
      setSubcategories(cached);
      return;
    }

    (async () => {
      setIsFetchingSubs(true);
      const res = await getSubcategoriesByCategory({
        categoryId: filters.categoryId!,
      });
      setIsFetchingSubs(false);
      if (!active) return;
      const items = toBasic(res?.data?.documents ?? res?.data?.documents ?? []);
      catalogCache.subcategoriesByCategory.set(filters.categoryId!, items);
      setSubcategories(items);
    })();

    return () => {
      active = false;
    };
  }, [filters.categoryId]);

  const [productTypes, setProductTypes] = useState<BasicItem[]>([]);
  useEffect(() => {
    let active = true;

    if (!filters.subcategoryId) {
      setProductTypes([]);
      return;
    }

    const cached = catalogCache.productTypesBySubcategory.get(
      filters.subcategoryId!
    );
    if (cached) {
      setProductTypes(cached);
      return;
    }

    (async () => {
      setIsFetchingTypes(true);
      const res = await getProductTypesBySubcategory({
        subcategoryId: filters.subcategoryId!,
      });
      setIsFetchingTypes(false);
      if (!active) return;
      const items = toBasic(res?.data?.documents ?? res?.data?.documents ?? []);
      catalogCache.productTypesBySubcategory.set(filters.subcategoryId!, items);
      setProductTypes(items);
    })();

    return () => {
      active = false;
    };
  }, [filters.subcategoryId]);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    const processed = value === "all" ? undefined : value;

    if (key === "categoryId") {
      onFiltersChange({
        ...filters,
        categoryId: processed,
        subcategoryId: undefined,
        productTypeId: undefined,
      });
      return;
    }
    if (key === "subcategoryId") {
      onFiltersChange({
        ...filters,
        subcategoryId: processed,
        productTypeId: undefined,
      });
      return;
    }

    onFiltersChange({ ...filters, [key]: processed });
  };

  const debouncedSubmit = useDebouncedCallback(() => {
    handleFilterChange("search", localSearch.trim());
  }, 450);

  const onSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = e.target.value;
    setLocalSearch(v);
    debouncedSubmit(); // don’t refetch on every keystroke; debounce it
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", localSearch.trim());
  };

  const clearFilters = () => {
    setLocalSearch("");
    onFiltersChange({
      search: "",
      categoryId: undefined,
      subcategoryId: undefined,
      productTypeId: undefined,
      status: "active",
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      radiusKm: 50,
      view: "all",
    });
  };

  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

  const anyLoading =
    isLoading || isFetchingCats || isFetchingSubs || isFetchingTypes;

  return (
    <div className="mb-6 space-y-4">
      <Tabs
        value={filters.view || "all"}
        onValueChange={(v) => handleFilterChange("view", v)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            All Products
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Nearby Products
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className={cn(anyLoading && "opacity-60 pointer-events-none")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex items-center gap-2">
              {anyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={localSearch}
              onChange={onSearchChange}
              className="pl-10"
            />
          </form>

          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.categoryId || "all"}
                  onValueChange={(v) => handleFilterChange("categoryId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select
                  value={filters.subcategoryId || "all"}
                  onValueChange={(v) => handleFilterChange("subcategoryId", v)}
                  disabled={!filters.categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subcategories.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Type */}
              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select
                  value={filters.productTypeId || "all"}
                  onValueChange={(v) => handleFilterChange("productTypeId", v)}
                  disabled={!filters.subcategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {productTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(v) => handleFilterChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min/Max Price */}
              <div>
                <Label htmlFor="minPrice">Min Price</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  placeholder="0"
                  value={filters.minPrice ?? ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "minPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  placeholder="999999"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "maxPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* Sort By / Order */}
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select
                  value={filters.sortBy || "default"}
                  onValueChange={(v) => handleFilterChange("sortBy", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="basePrice">Price</SelectItem>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="updatedAt">Date Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select
                  value={filters.sortOrder || "asc"}
                  onValueChange={(v) => handleFilterChange("sortOrder", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nearby radius */}
              {filters.view === "nearby" && (
                <div>
                  <Label htmlFor="radiusKm">Radius (km)</Label>
                  <Input
                    inputMode="numeric"
                    type="number"
                    placeholder="50"
                    value={filters.radiusKm ?? ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "radiusKm",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              )}
            </div>
          )}

          {isExpanded && (
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
