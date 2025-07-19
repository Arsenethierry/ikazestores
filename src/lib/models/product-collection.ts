import { Query } from "node-appwrite";
import { BaseModel } from "../core/database";
import { PRODUCTS_COLLECTIONS_COLLECTION_ID } from "../env-config";
import { CollectionTypes } from "../types";

export class ProductCollection extends BaseModel<CollectionTypes> {
    constructor() {
        super(PRODUCTS_COLLECTIONS_COLLECTION_ID)
    }

    async findByStoreId(
        storeId: string | null,
        options: { limit?: number; featured?: boolean } = {}
    ) {
        const { limit = 10, featured = false } = options;
        const baseQueries = [Query.limit(limit)];

        if (storeId) {
            baseQueries.push(Query.or([
                Query.equal("storeId", storeId),
                Query.isNull("storeId")
            ]));
        } else {
            baseQueries.push(Query.isNull("storeId"));
        }

        const queries = [...baseQueries];
        if (featured) {
            queries.push(Query.equal("featured", true));
        }

        let result = await this.executeCustomQuery(queries);

        if (result.total === 0 && featured) {
            result = await this.executeCustomQuery(baseQueries);
        }

        return {
            collections: result.documents,
            total: result.total
        };
    }

    async getAll(options: {
        limit?: number;
        offset?: number;
        search?: string;
        featured?: boolean;
    } = {}) {
        const { featured, ...queryOptions } = options;
        if (featured) {
            const queries = [
                Query.limit(options.limit || 25),
                Query.equal('featured', true),
                Query.orderDesc('$createdAt')
            ];
            if (options.search) {
                queries.push(Query.search('name', options.search));
            }

            const result = await this.executeCustomQuery(queries);
            return {
                collections: result.documents,
                total: result.total
            };
        }

        const result = await this.findMany({
            ...queryOptions,
            searchFields: ['name', 'description'],
            orderBy: '$createdAt',
            orderType: 'desc'
        });

        return {
            collections: result.documents,
            total: result.total
        };
    }
}