import { BaseStorageService } from "../core/storage";
import { PRODUCTS_BUCKET_ID, STORE_BUCKET_ID } from "../env-config";

export class StoreStorageService extends BaseStorageService {
    constructor() {
        super(STORE_BUCKET_ID)
    }
}

export class ProductsStorageService extends BaseStorageService {
    constructor() {
        super(PRODUCTS_BUCKET_ID);
    }
}