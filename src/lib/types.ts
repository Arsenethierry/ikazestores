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
}

export type CreateVirtualStoreParams = {
    ownerId: string;
    storeName: string;
    desccription?: string;
    storeBio?: string;
    storeBanner?: File[];
}

export type CurrentUserType = {
    currentUser: Models.User<Models.Preferences>
}

export type ImageDimensionConstraints = {
    width?: number;
    height?: number;
    ratio?: number;
    tolerance?: number;
};

export type StoreTypes = {
    store: Models.Document;
};