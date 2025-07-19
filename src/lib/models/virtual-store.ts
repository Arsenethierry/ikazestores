import { Query } from "node-appwrite";
import { BaseModel } from "../core/database";
import { VIRTUAL_STORE_ID } from "../env-config";
import { VirtualStoreTypes } from "../types/store-types";

export class VirtualStore extends BaseModel<VirtualStoreTypes> {
    constructor() {
        super(VIRTUAL_STORE_ID);
    }

    async findBySlug(slug: string): Promise<VirtualStoreTypes | null> {
        const result = await this.findMany({
            limit: 1,
            search: slug,
            searchFields: ['slug']
        });
        return result.documents[0] || null;
    }

    async findByOwner(ownerId: string): Promise<VirtualStoreTypes[]> {
        const result = await this.findMany({
            search: ownerId,
            searchFields: ['owner']
        });
        return result.documents;
    }

    async getAll(options: {
        limit?: number;
        offset?: number;
        search?: string;
    } = {}) {
        const result = await this.findMany({
            limit: options.limit || 25,
            offset: options.offset || 0,
            search: options.search,
            searchFields: ['name', 'description'],
            orderBy: '$createdAt',
            orderType: 'desc'
        });

        return {
            stores: result.documents,
            total: result.total,
            limit: result.limit,
            offset: result.offset
        };
    }

    async getFeatured(limit = 10): Promise<VirtualStoreTypes[]> {
        const queries = [
            Query.limit(limit),
            Query.equal('featured', true),
            Query.equal('status', 'active'),
            Query.orderDesc('$createdAt')
        ];

        const result = await this.executeCustomQuery(queries);
        return result.documents;
    }
}