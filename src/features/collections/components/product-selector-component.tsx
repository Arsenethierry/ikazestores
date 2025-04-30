"use client";

import { useState, useEffect } from 'react';
import { VirtualProductTypes, CollectionGroupsTypes } from '@/lib/types';
import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  addProductsToCollection, 
  getCollectionById 
} from '@/features/collections/actions/collections-actions';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction } from 'next-safe-action/hooks';
import { getVirtualStoreProducts } from '@/features/products/actions/virtual-products-actions';

export const ProductSelectorComponent = ({
  collectionId,
  storeId,
  groupId = null,
  collectionType,
  initialProducts,
  initialTotalPages,
  initialTotal,
  initialGroups = []
}: {
  collectionId: string;
  storeId: string;
  groupId?: string | null;
  collectionType: 'simple' | 'grouped';
  initialProducts: VirtualProductTypes[];
  initialTotalPages: number;
  initialTotal: number;
  initialGroups?: CollectionGroupsTypes[];
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<VirtualProductTypes[]>(initialProducts);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalProducts, setTotalProducts] = useState(initialTotal);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupId);
  const [groups, setGroups] = useState<CollectionGroupsTypes[]>(initialGroups);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page') || '1');
  const currentSearch = searchParams.get('search') || '';
  const currentGroupId = searchParams.get('groupId') || null;

  const { execute: addToCollection, status } = useAction(addProductsToCollection);

  // Fetch groups if collection type is 'grouped' and we don't have them yet
  useEffect(() => {
    const fetchGroups = async () => {
      if (collectionType === 'grouped' && groups.length === 0) {
        try {
          const collectionData = await getCollectionById({ 
            collectionId, 
            withGroups: true 
          });
          
          if (collectionData && collectionData.groupsData) {
            setGroups(collectionData.groupsData);
          }
        } catch (error) {
          console.error("Failed to load groups:", error);
        }
      }
    };
    
    fetchGroups();
  }, [collectionId, collectionType, groups.length]);

  // Fetch products client-side
  const fetchProducts = async (page: number, search: string, groupId?: string | null) => {
    console.log(groupId)
    setIsLoading(true);
    try {
      const productsData = await getVirtualStoreProducts({
        virtualStoreId: storeId,
        limit: 8, // Increased from 2 to show more products
        page,
        search: search || undefined
      });
      
      setProducts(productsData?.documents || []);
      setTotalPages(productsData?.totalPages || 0);
      setTotalProducts(productsData?.total || 0);
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update URL without full page refresh
  const updateUrl = (page: number, search: string, groupId?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    
    if (groupId) {
      params.set('groupId', groupId);
    } else {
      params.delete('groupId');
    }
    
    // Update URL without refreshing the page
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Handle search input submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPage = 1; // Reset to first page on new search
    updateUrl(newPage, searchInputValue, selectedGroupId);
    fetchProducts(newPage, searchInputValue, selectedGroupId);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateUrl(page, currentSearch, selectedGroupId);
    fetchProducts(page, currentSearch, selectedGroupId);
  };

  // Handle group change
  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    updateUrl(1, currentSearch, groupId);
    fetchProducts(1, currentSearch, groupId);
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Submit selected products to collection
  const handleAddToCollection = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    addToCollection(
      { 
        collectionId, 
        productsIds: selectedProducts, 
        groupId: collectionType === 'grouped' ? selectedGroupId : null 
      },
      // {
      //   onSuccess: (data) => {
      //     if (data.error) {
      //       toast.error(data.error);
      //     } else {
      //       toast.success(data.success || "Products added successfully");
      //       setSelectedProducts([]);
      //     }
      //   },
      //   onError: () => {
      //     toast.error("Failed to add products to collection");
      //   }
      // }
    );
  };

  // Update search input when URL param changes
  useEffect(() => {
    setSearchInputValue(currentSearch);
  }, [currentSearch]);

  // Update selected group when URL param changes
  useEffect(() => {
    if (currentGroupId) {
      setSelectedGroupId(currentGroupId);
    }
  }, [currentGroupId]);

  // Reset selected products when page, search, or group changes
  useEffect(() => {
    setSelectedProducts([]);
  }, [currentPage, currentSearch, currentGroupId]);

  // Generate pagination links
  const paginationItems = () => {
    // [Same pagination logic as before]
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(1);
          }}
          isActive={currentPage === 1}
          href="#"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed after first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= totalPages && i >= 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
              isActive={currentPage === i}
              href="#"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    // Show ellipsis if needed before last page
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(totalPages);
            }}
            isActive={currentPage === totalPages}
            href="#"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-4">
        <h5 className="text-2xl font-medium">Browse and add products to collection</h5>
        
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Group selector for grouped collections */}
          {collectionType === 'grouped' && (
            <div className="w-full md:w-1/3">
              <Select 
                value={selectedGroupId || ""} 
                onValueChange={handleGroupChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.$id} value={group.$id}>
                      {group.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <form onSubmit={handleSearchSubmit} className="flex w-full md:w-1/2 gap-2">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          
          <Button 
            onClick={handleAddToCollection} 
            disabled={selectedProducts.length === 0 || status === 'executing' || (collectionType === 'grouped' && !selectedGroupId)}
            className="w-full md:w-auto"
          >
            {status === 'executing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                Add {selectedProducts.length} {selectedProducts.length === 1 ? 'Product' : 'Products'} 
                {collectionType === 'grouped' && selectedGroupId ? ` to Group` : ' to Collection'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Products display and pagination (Same as before) */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No products found. Try a different search term.
        </div>
      ) : (
        <>
          <div className="grid gap-x-4 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div 
                key={product.$id} 
                className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                  selectedProducts.includes(product.$id) 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleProductSelection(product.$id)}
              >
                {/* Selection indicator */}
                {selectedProducts.includes(product.$id) && (
                  <div className="absolute top-2 right-2 z-10 bg-primary text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                
                {/* Product image */}
                <div className="relative h-40 w-full bg-muted">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                
                {/* Product info */}
                <div className="p-3">
                  <h3 className="font-medium line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {product.description || 'No description'}
                  </p>
                  <div className="mt-2 text-sm font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(product.price || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex flex-col gap-2 items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {products.length} of {totalProducts} products
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      href="#"
                      aria-disabled={currentPage <= 1}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {paginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      href="#"
                      aria-disabled={currentPage >= totalPages}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};