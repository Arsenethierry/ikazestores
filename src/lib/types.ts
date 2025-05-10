import { Models } from "node-appwrite";

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

export type CurrentUserType = Models.User<Models.Preferences> | null;

export type ImageDimensionConstraints = {
    width?: number;
    height?: number;
    ratio?: number;
    tolerance?: number;
};

export interface StoreTypes {
    store: Models.Document;
};

export type UserRoleType = 'physicalStoreOwner' | 'virtualStoreOwner' | 'buyer' | 'sysAdmin';

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

export type AuthStatus = {
    isPhysicalStoreOwner: boolean;
    isAuthenticated: boolean;
    isVirtualStoreOwner: boolean;
    isSystemAdmin: boolean;
}

export interface PhysicalStoreTypes extends Models.Document {
    storeName: string,
    owner: string,
    description?: string,
    bio?: string,
    storeType: 'physicalStore' | 'virtualVirtual',
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
    storeType: 'physicalStore' | 'virtualVirtual',
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
    price: number,
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
    generalProductImages: string[]
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
    price: {
        min: number;
        max: number;
    };
    sizes: string[];
    productTypes: string[];
};

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