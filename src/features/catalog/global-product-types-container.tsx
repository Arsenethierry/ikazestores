"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/components/ui/multiselect";
import { useDeleteProductType } from "@/hooks/queries-and-mutations/use-catalog-actions";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Edit,
  Eye,
  EyeOff,
  Grid3X3,
  MoreHorizontal,
  Search,
  Trash2,
  Package,
  Settings,
  ArrowRight,
  Filter,
  Download,
  Upload,
  Layers,
  FolderOpen,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, {
  Suspense,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import Link from "next/link";
import { CatalogProductTypes } from "@/lib/types/appwrite/appwrite";
import { Skeleton } from "@/components/ui/skeleton";
import { getCatalogCategories } from "@/lib/actions/catalog-server-actions";

interface GlobalProductTypeCardProps {
  productType: CatalogProductTypes & {
    categoryName?: string;
    subcategoryName?: string;
  };
  onEdit: (productType: any) => void;
  onDelete: (productTypeId: string) => void;
}

const GlobalProductTypeCard = React.memo<GlobalProductTypeCardProps>(
  ({ productType, onEdit, onDelete }) => {
    return (
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {productType.productTypeName}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {productType.description || "No description"}
                </CardDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Layers className="w-3 h-3 mr-1" />
                    {productType.categoryName || "Unknown Category"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    {productType.subcategoryName || "Unknown Subcategory"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <Badge variant={productType.isActive ? "default" : "secondary"}>
                {productType.isActive ? (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/admin/sys-admin/catalog/product-types/${productType.$id}`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Variants
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/admin/sys-admin/catalog/categories/${productType.categoryId}/subcategories/${productType.subcategoryId}`}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      View in Category
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(productType)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product Type
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(productType.$id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product Type
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Slug: {productType.slug}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/admin/sys-admin/catalog/product-types/${productType.$id}`}
              >
                <Settings className="h-4 w-4 mr-1" />
                Configure
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

GlobalProductTypeCard.displayName = "GlobalProductTypeCard";

interface GlobalProductTypesContainerProps {
  initialData: {
    documents: any[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function GlobalProductTypesContainer({
  initialData,
}: GlobalProductTypesContainerProps) {
  const [editingProductType, setEditingProductType] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { execute: deleteProductType } = useDeleteProductType();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Product Type",
    "Are you sure you want to delete this product type? This action cannot be undone.",
    "destructive"
  );

  // Load categories for filtering
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCatalogCategories({
          limit: 100,
          includeInactive: false,
        });
        if (result.success && result.data) {
          setCategories(result.data.documents || []);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debouncedSearchTerm) {
      params.set("search", debouncedSearchTerm);
    } else {
      params.delete("search");
    }

    if (selectedCategory !== "all") {
      params.set("categoryId", selectedCategory);
    } else {
      params.delete("categoryId");
    }

    if (selectedSubcategory !== "all") {
      params.set("subcategoryId", selectedSubcategory);
    } else {
      params.delete("subcategoryId");
    }

    if (statusFilter !== "all") {
      params.set(
        "includeInactive",
        statusFilter === "inactive" ? "true" : "false"
      );
    } else {
      params.delete("includeInactive");
    }

    router.push(`?${params.toString()}`, { scroll: false });
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedSubcategory,
    statusFilter,
    searchParams,
    router,
  ]);

  const filteredProductTypes = useMemo(() => {
    let filtered = initialData.documents;

    // Client-side search filter (for immediate feedback)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (productType: any) =>
          productType.productTypeName
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          productType.description
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          productType.categoryName
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          productType.subcategoryName
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((productType: any) => productType.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((productType: any) => !productType.isActive);
    }

    return filtered;
  }, [initialData.documents, debouncedSearchTerm, statusFilter]);

  const handleEdit = useCallback((productType: any) => {
    setEditingProductType(productType);
  }, []);

  const handleDelete = useCallback(
    async (productTypeId: string) => {
      const confirmed = await confirm();
      if (confirmed) {
        deleteProductType({ productTypeId });
      }
    },
    [confirm, deleteProductType]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setStatusFilter("all");
  }, []);

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Advanced Filters
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.$id} value={category.$id}>
                    {category.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center">
              <Badge variant="outline" className="whitespace-nowrap">
                {filteredProductTypes.length} of {initialData.total} types
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Types Grid */}
      {filteredProductTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Grid3X3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No product types found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchTerm ||
                selectedCategory !== "all" ||
                statusFilter !== "all"
                ? "No product types match your current filters. Try adjusting your search criteria."
                : "Get started by creating your first product type within a category."}
            </p>
            <div className="flex items-center space-x-2">
              {(searchTerm ||
                selectedCategory !== "all" ||
                statusFilter !== "all") && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              <Button asChild>
                <Link href="/admin/sys-admin/catalog/categories">
                  <Layers className="h-4 w-4 mr-2" />
                  Manage Categories
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProductTypes.map((productType: any) => (
            <GlobalProductTypeCard
              key={productType.$id}
              productType={productType}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {initialData.hasMore && (
        <div className="flex justify-center">
          <Button variant="outline">Load More Product Types</Button>
        </div>
      )}

      <ConfirmDialog />
    </div>
  );
}

export function GlobalProductTypesContainerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters Skeleton */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
