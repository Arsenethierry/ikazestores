import { Models, Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { DATABASE_ID } from "../env-config";
import { AppwriteErrorHandler } from "../errors/appwrite-errors";

export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderType?: 'asc' | 'desc';
    search?: string;
    searchFields?: string[];
}

export interface PaginationResult<T> {
    documents: T[];
    total: number;
    limit: number;
    offset: number;
}

export abstract class BaseModel<T extends Models.Document> {
    constructor(protected collectionId: string) { };

    async findById(id: string): Promise<T | null> {
        try {
            const { databases } = await createSessionClient();
            const document = await databases.getDocument<T>(DATABASE_ID, this.collectionId, id);
            return document;
        } catch (error) {
            const appwriteError = AppwriteErrorHandler.handle(error);
            if (appwriteError.status === 404) return null;
            throw appwriteError;
        }
    }

    async findMany(options: QueryOptions = {}): Promise<PaginationResult<T>> {
        try {
            const { databases } = await createSessionClient();
            const queries = this.buildQueries(options);
            const response = await databases.listDocuments<T>(DATABASE_ID, this.collectionId, queries);

            return {
                documents: response.documents,
                total: response.total,
                limit: options.limit || 25,
                offset: options.offset || 0,
            };
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
    }

    protected buildQueries(options: QueryOptions): string[] {
        const queries: string[] = [];

        if (options.limit) queries.push(Query.limit(options.limit));
        if (options.offset) queries.push(Query.offset(options.offset));
        if (options.orderBy) {
            const orderType = options.orderType === 'desc' ? Query.orderDesc : Query.orderAsc;
            queries.push(orderType(options.orderBy));
        }
        if (options.search && options.searchFields) {
            options.searchFields.forEach(field => {
                queries.push(Query.search(field, options.search!));
            });
        }

        return queries;
    }

    protected async executeCustomQuery(queries: string[]): Promise<PaginationResult<T>> {
        try {
            const { databases } = await createSessionClient();
            const response = await databases.listDocuments<T>(DATABASE_ID, this.collectionId, queries);
            return {
                documents: response.documents,
                total: response.total,
                limit: 25,
                offset: 0,
            };
        } catch (error) {
            throw AppwriteErrorHandler.handle(error);
        }
    }
}