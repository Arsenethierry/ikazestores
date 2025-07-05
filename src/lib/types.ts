import { Models } from "node-appwrite";
import { UserAccountType, UserRole } from "./constants";

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
    address?: string,
    country: string,
    storeLogoUrl: string & File | undefined,
    storeLogoId?: string
    subDomain: string;
    vitualProducts: VirtualProductTypes[],
    locale?: string;
};

export interface CategoryTypes extends Models.Document {
    categoryName: string,
    iconUrl?: File | undefined & string,
    subCategoriesIds?: string[],
    iconFileId?: string,
    storeId?: string,
    createdBy: string
}
export interface SubCategoryTypes extends Models.Document {
    subCategoryName: string,
    iconUrl?: File | undefined & string,
    parentCategoryIds: string[],
    iconFileId?: string,
    storeId?: string,
    createdBy: string
}

export interface OriginalProductTypes extends Models.Document {
    title: string,
    description: string,
    basePrice: number,
    createdBy: string,
    store: PhysicalStoreTypes,
    storeId: string,
    category: CategoryTypes,
    seeded: boolean,
    isPublished: boolean,
    storeLat: number,
    storeLong: number,
    storeOriginCountry: string,
    colorImages: ColorImagesTypes[],
    subcategoryIds: string[],
    generalProductImages: string[],
    hasVariants: boolean,
    status: 'text' | 'color' | 'select' | 'boolean' | 'multiselect'
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
    currency: string
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

// export interface ProductType extends Models.Document {
//     name: string;
//     description?: string;
//     storeId?: string;
//     createdBy: string;
// };

// export interface VariantOptions extends Models.Document {
//     variantTemplateId: string;
//     name: string; // Display name
//     value: string; // Internal value
//     additionalPrice: number;
//     colorCode?: string;
//     imageUrl?: string;
//     sortOrder: number;
//     isActive: boolean;
//     // Enhanced fields
//     description?: string;
//     hexCode?: string; // More specific than colorCode
//     swatchImage?: string; // Separate from main image
//     availability: boolean;
//     popularityScore?: number; // For sorting popular options first
//     seasonality?: 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
//     materialCode?: string; // For fabric/material variants
//     sizeChart?: string; // Reference to size chart
// };

// export interface VariantTemplate extends Models.Document {
//     name: string;
//     description?: string;
//     inputType: 'select' | 'multiselect' | 'color' | 'size' | 'text' | 'boolean';
//     isRequired: boolean;
//     defaultValue?: string;
//     displayOrder: number; // For consistent UI ordering
//     affectsPricing: boolean; // Whether this variant affects price
//     affectsInventory: boolean; // Whether this variant has separate inventory
//     affectsShipping: boolean; // Whether this variant affects shipping (size/weight)
//     options?: VariantOptions[];
//     validation?: {
//         minSelections?: number;
//         maxSelections?: number;
//         pattern?: string; // For text inputs
//     };
// };

export interface Category {
    id: string;
    name: string;
    subcategories?: Subcategory[];
}

export interface Subcategory {
    id: string;
    name: string;
    productTypes: string[];
}

export interface VariantOption {
    value: string;
    name?: string;
    additionalPrice?: number;
    colorCode?: string;
}

export interface VariantTemplate extends Models.Document {
    id: string;
    name: string;
    type: "text" | "color" | "range" | "number" | "select";
    variantOptions: { value: string; label: string; colorCode?: string; metadata: { count: number } }[];
    minValue?: number;
    maxValue?: number;
    step?: number;
    unit?: string;
    group?: string;
    isRequired?: boolean;
}
export interface VariantTemplateTypes {
    id: string;
    name: string;
    inputType: "text" | "color" | "range" | "number" | "select" | 'multiselect' | 'boolean';
    variantOptions: { value: string; label: string; colorCode?: string; additionalPrice?: number, metadata: { count: number } }[];
    minValue?: number;
    maxValue?: number;
    step?: number;
    unit?: string;
    group?: string;
    isRequired?: boolean;
    subcategoryIds?: string[];
    productTypeIds?: string[];
    categoryIds?: string[];
}

export interface ProductTypeTypes {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    defaultVariantTemplates?: string[];
    subcategoryId?: string;
}
export interface ProductType extends Models.Document {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    defaultVariantTemplates?: string[];
    subcategoryId?: string;
}

export interface ProductCombination {
    id: string;
    variantValues: Record<string, string>;
    sku: string;
    price: number;
    quantity?: number;
    isDefault?: boolean;
    variantStrings?: string[];
    weight?: number;
}