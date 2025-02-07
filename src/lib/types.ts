
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
    storeBanner?: FormData | undefined;
}