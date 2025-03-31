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

export type DocumentType = Models.Document

export type AppwriteDocumentResponse = {
    total: number;
    documents: DocumentType;
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

export interface PhysicalStoreTypes extends DocumentType {
    storeName: string,
    owner: string,
    description?: string,
    bio?: string,
    storeType: 'physicalStore' | 'virtualVirtual',
    products?: DocumentType[],
    latitude?: number,
    longitude?: number,
    address?: string,
    country: string,
    storeLogoUrl: string,
    createFrom?: string,
    storeLogoId?: string
}