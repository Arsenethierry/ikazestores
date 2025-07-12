import { Models } from "node-appwrite";
import { UserAccountType, UserRole } from "./constants";
import { ProductCombination } from "./schemas/product-variants-schema";

export type SignInParams = {
    email: string;
    password: string;
}

export type SignUpParams = {
    username: string;
    phoneNumber: string;
    email: string;
    password: string;
}

// type SocialLinks = {
//     instagram?: string;
//     twitter?: string;
//     facebook?: string;
//     linkedin?: string;
// };

export type CurrentUserType = Models.User<Models.Preferences> | null;

export type ImageDimensionConstraints = {
    width?: number;
    height?: number;
    ratio?: number;
    tolerance?: number;
};

export type UserRoleType =
    | UserRole.SYS_ADMIN
    | UserRole.SYS_AGENT
    | UserRole.PHYSICAL_STORE_OWNER
    | UserRole.VIRTUAL_STORE_OWNER
    | UserRole.STORE_ADMIN
    | UserRole.STORE_STAFF

export type AppwriteDocumentResponse = {
    total: number;
    documents: Models.Document;
};

export type AdminDashboardType = 'systemAdmin' | 'virtualStoreAdmin' | 'physicalStoreAdmin' | undefined;

export type CartItem = {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
};

export interface Cart {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
};

export interface AuthState {
    isAuthenticated: boolean;
    user: Models.User<Models.Preferences> | null;
    roles: UserRoleType[];
    teams: Models.Team<Models.Preferences>[];
    memberships: Models.Membership[];
    isSystemAdmin: boolean;
    isSystemAgent: boolean;
    isVirtualStoreOwner: boolean;
    isPhysicalStoreOwner: boolean;
    isStoreOwner: boolean;
    isStoreAdmin: boolean;
    isStoreStaff: boolean;
    ownedStores: string[];
    adminStores: string[];
    staffStores: string[];
    hasSystemAccess: () => boolean;
    canAccessStore: (storeId: string) => boolean;
    getStoreRole: (storeId: string) => 'owner' | 'admin' | 'staff' | null;
    hasStorePermission: (storeId: string, permission: 'read' | 'write' | 'delete') => boolean;
    canAccessResource: (resource: string, permission: 'read' | 'write' | 'delete') => boolean;
}

export interface PhysicalStoreTypes extends Models.Document {
    storeName: string,
    owner: string,
    description?: string,
    bio?: string,
    storeType: 'physicalStore' | 'virtualStore',
    products?: Models.Document[],
    latitude?: number,
    longitude?: number,
    address?: string,
    country: string,
    storeLogoUrl: string & File | undefined,
    createFrom?: string,
    storeLogoId?: string;
    currency: string
};

export interface VirtualStoreTypes extends Models.Document {
    storeName: string,
    owner: string,
    description?: string,
    storeBio?: string,
    bannerUrls?: string[] & File[] | undefined;
    bannerIds?: string[];
    storeType: 'physicalStore' | 'virtualStore',
    country: string,
    storeLogoUrl: string & File | undefined,
    storeLogoId?: string
    subDomain: string;
    virtualProductsIds?: string[],
    locale?: string;
    operatingCountries: string[]
};
export interface OriginalProductTypes extends Models.Document {
    name: string,
    description: string,
    shortDescription?: string;
    sku: string;
    basePrice: number;
    status: 'active' | 'archived' | 'draft',
    featured: boolean;
    categoryId: string;
    subcategoryId: string;
    productTypeId: string;
    tags: string[],
    weight: number,
    dimensions: string;
    hasVariants: boolean;
    variantIds: string[];
    combinationIds: string[],
    images: string[],
    storeLat: number;
    storeLong: number;
    storeOriginCountry: string;
    createdBy: string;
    currency: string;
}

export interface OriginalProductWithVirtualProducts extends OriginalProductTypes {
    combinations?: ProductCombinationTypes[];
    virtualProducts: VirtualProductTypes[];
    priceRange: {
        min: number;
        max: number;
    };
}

export interface ProductCombinationTypes extends Models.Document {
    productId: string;
    variantStrings?: string[];
    sku: string;
    price: number;
    stockQuantity: number;
    isActive: boolean;
    weight?: number;
    dimensions?: string;
    images?: string[]
}
export interface VirtualProductTypes extends Models.Document {
    purchasePrice: number;
    sellingPrice: number;
    createdBy: string;
    title: string;
    description: string;
    generalImageUrls: string[];
    originalProductId: string;
    virtualStore: VirtualStoreTypes;
    virtualStoreId: string;
    archived: boolean;
    categoryNames?: string[];
    currency: string;
}
export interface ColorImagesTypes extends Models.Document {
    colorName: string,
    imageId: string,
    imageUrl: string,
    colorHex?: string
}

enum OrderStatus {
    pending = 'pending',
    shipped = 'shipped',
    delivered = 'delivered',
    cancelled = 'cancelled'
}


export interface OrderItem {
    quantity: number;
    price: number;
    order: OrderTypes;
    productId: string
}
export interface OrderTypes extends Models.Document {
    customerId: string;
    orderDate: Date;
    status: OrderStatus;
    totalAmount: number;
    notes: string;
    orderItems: OrderItem[];
    deliveryAddressId: string;
}

export interface FilterState {
    storeId?: string;
    productType?: string;
    category?: string;
    page: number;
    limit: number;
    sortBy?: string;
    variants?: { templateId: string; values: string[] }[];
    priceRange?: { min?: number; max?: number };
    search?: string;
}

export enum SortBy {
    newestFirst = 'newest',
    priceLowToHigh = 'price_asc',
    priceHighToLow = 'price_desc',
}

export type VirtualProductsSearchParams = {
    category?: string,
    subcategory?: string,
    sortBy?: SortBy | undefined | string,
    lastId?: string;
    firstId?: string;
    minPrice?: string;
    maxPrice?: string;
    query?: string;
}

export interface CollectionTypes extends Models.Document {
    collectionName: string;
    bannerImageUrl?: string;
    bannerImageId?: string;
    productIds?: string[];
    description?: string;
    storeId?: string;
    createdBy: string;
    featured: boolean;
    type: 'simple' | 'grouped';
    groups: string[],
}

export interface CollectionGroupsTypes extends Models.Document {
    groupImageUrl: string;
    groupImageId: string;
    groupName: string;
    displayOrder: number;
    collectionId: number;
    productsIds?: string[]
}

export interface SavedItemType extends Models.Document {
    userId: string;
    productId: string;
    productData?: VirtualProductTypes
}

export interface UserDataTypes extends Models.Document {
    fullName: string;
    email: string;
    phoneNumber?: string;
    accountType: UserAccountType
    // bio?: string;
    // website?: string;
    // socialLinks?: SocialLinks;
}

export interface ProductFilters {
    storeId?: string;
    categoryId?: string;
    subcategoryId?: string;
    productTypeId?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    tags?: string[];
    priceMin?: number;
    priceMax?: number;
    sortBy?: 'name' | 'price' | 'created' | 'updated';
    sortOrder?: 'asc' | 'desc';
    userLat?: number;
    userLng?: number;
    radiusKm?: number;
    combinations?: ProductCombination[]
}