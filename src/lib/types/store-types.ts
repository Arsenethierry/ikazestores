import { Models } from "node-appwrite";

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