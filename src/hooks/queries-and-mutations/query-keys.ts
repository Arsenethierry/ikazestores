import { PhysicalStoreFilters } from "@/lib/models/physical-store-model";
import { VirtualProductsSearchParams } from "@/lib/types";

export const virtualStoreKeys = {
    all: ['virtual-stores'] as const,
    list: (filters?: Record<string, any>) => ['virtual-stores', 'list', filters] as const,
    detail: (id: string) => ['virtual-store', id] as const,
};

export const physicalStoreKeys = {
    all: ['physical-stores'] as const,
    list: (filters?: PhysicalStoreFilters) => ['physical-stores', 'list', filters] as const,
    detail: (id: string) => ['physical-store', id] as const,
    byOwner: (ownerId: string) => ['physical-stores', 'by-owner', ownerId] as const,
    nearby: (lat: number, lng: number, radius: number) => ['physical-stores', 'nearby', lat, lng, radius] as const,
    search: (term: string) => ['physical-stores', 'search', term] as const,
    byCountry: (country: string) => ['physical-stores', 'by-country', country] as const,
};

export const virtualProductsKeys = {
    all: ['virtual-products'] as const,
    lists: () => [...virtualProductsKeys.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...virtualProductsKeys.lists(), { filters }] as const,
    detail: (id: string) => [...virtualProductsKeys.all, id] as const,
    search: (query: string) => [...virtualProductsKeys.all, 'search', query] as const,
    store: (storeId: string) => [...virtualProductsKeys.all, 'store', storeId] as const,
    storeProducts: (storeId: string, filters?: any) =>
        [...virtualProductsKeys.store(storeId), filters] as const,
    originalProduct: (originalProductId: string) =>
        [...virtualProductsKeys.all, 'original', originalProductId] as const,
    nearby: (params: { userLat: number; userLng: number; radiusKm: number }) =>
        [...virtualProductsKeys.all, 'nearby', params] as const,
    clone: (originalProductId: string, virtualStoreId: string) =>
        [...virtualProductsKeys.all, 'clone', originalProductId, virtualStoreId] as const,
    paginated: (searchParams: VirtualProductsSearchParams, storeId?: string) =>
        [...virtualProductsKeys.all, searchParams, storeId] as const,
    status: (status: string) => [...virtualProductsKeys.all, 'status', status] as const,
    owner: (ownerId: string) => [...virtualProductsKeys.all, 'owner', ownerId] as const,
};

export const collectionKeys = {
    // Base keys
    all: ['collections'] as const,
    lists: () => [...collectionKeys.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...collectionKeys.lists(), { filters }] as const,
    
    // Collection details
    details: () => [...collectionKeys.all, 'detail'] as const,
    detail: (id: string) => [...collectionKeys.details(), id] as const,
    
    // Collections by store
    byStoreKey: () => [...collectionKeys.all, 'byStore'] as const,
    byStore: (storeId: string | null, options?: { limit?: number; featured?: boolean }) => 
        [...collectionKeys.byStoreKey(), storeId, options] as const,
    
    // Collection with groups
    withGroupsKey: () => [...collectionKeys.all, 'withGroups'] as const,
    withGroups: (id: string) => [...collectionKeys.withGroupsKey(), id] as const,
    
    // Collection groups
    groupsKey: () => [...collectionKeys.all, 'groups'] as const,
    groups: (collectionId: string) => [...collectionKeys.groupsKey(), collectionId] as const,
    
    // Collection products
    productsKey: () => [...collectionKeys.all, 'products'] as const,
    products: (collectionId: string, groupId?: string, page?: number, limit?: number) => 
        [...collectionKeys.productsKey(), collectionId, { groupId, page, limit }] as const,
    
    // Utility functions for cache invalidation
    invalidateByCollection: (collectionId: string) => [
        collectionKeys.detail(collectionId),
        collectionKeys.withGroups(collectionId),
        collectionKeys.groups(collectionId),
        collectionKeys.productsKey() // This will invalidate all product queries for the collection
    ] as const,
    
    invalidateByStore: (storeId: string | null) => [
        collectionKeys.byStore(storeId),
        collectionKeys.lists() // This will invalidate general list queries
    ] as const,
    
    // Featured collections
    featuredKey: () => [...collectionKeys.all, 'featured'] as const,
    featured: (storeId?: string, limit?: number) => 
        [...collectionKeys.featuredKey(), { storeId, limit }] as const,
}
