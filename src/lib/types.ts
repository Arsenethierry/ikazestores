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

export type CreatePhysicalStoreParams = {
    ownerId: string;
    storeName: string;
    desccription?: string;
    storeBio?: string;
    storeBanner?: File[];
    storeLogo?: File;
}

export type CreateVirtualStoreParams = {
    ownerId: string;
    storeName: string;
    desccription?: string;
    storeBio?: string;
    storeBanner?: File[];
    storeLogo?: File;
    subDomain: string;
}

export type CurrentUserType = {
    currentUser?: Models.User<Models.Preferences> | null;
}

export type ImageDimensionConstraints = {
    width?: number;
    height?: number;
    ratio?: number;
    tolerance?: number;
};

export interface StoreTypes extends CurrentUserType {
    store: Models.Document;
};

export type UserRoleType = 'physicalStoreOwner' | 'virtualStoreOwner' | 'buyer' | 'sysAdmin';

export type DocumentType = Models.Document

export type AppwriteDocumentResponse = {
    total: number;
    documents: DocumentType;
  };
