"use server";

import { authMiddleware } from "@/lib/actions/middlewares";
import { AppwriteRollback } from "@/lib/actions/rollback";
import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, VIRTUAL_PRODUCT_ID } from "@/lib/env-config";
import { deleteVirtualProductSchema, VirtualProductSchema } from "@/lib/schemas/products-schems";
import { SortBy, VirtualProductsSearchParams, VirtualProductTypes } from "@/lib/types";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const getVirtualStoreProducts = async ({
    virtualStoreId,
    limit = 10,
    page = 1,
    search
}: {
    virtualStoreId: string;
    limit?: number;
    page?: number;
    search?: string
}) => {
    try {
        const { databases } = await createSessionClient();
        const query = search ? [Query.search("title", search)] : []
        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                ...query,
                Query.equal("virtualStore", virtualStoreId),
                Query.offset((page - 1) * limit),
                Query.limit(limit),
                Query.orderDesc('$createdAt')
            ]
        );

        return {
            documents: products.documents,
            total: products.total,
            totalPages: Math.ceil(products.total / limit)
        }
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error)
        return null
    }
}

export const getVirtualProductById = async (productId: string) => {
    try {
        const { databases } = await createSessionClient();
        const product = await databases.getDocument<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            productId
        );

        return product
    } catch (error) {
        console.log("getVirtualProductById: ", error)
        return null
    }
}

export const getAllVirtualProducts = async ({
    limit = 10,
    page = 1,
    search
}: {
    search?: string;
    page?: number;
    limit?: number
}) => {
    try {
        const { databases } = await createSessionClient();
        const query = search ? [Query.search("title", search)] : []
        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                ...query,
                Query.offset((page - 1) * limit),
                Query.limit(limit),
                Query.orderDesc('$createdAt')
            ]
        );

        return {
            documents: products.documents,
            total: products.total,
            totalPages: Math.ceil(products.total / limit)
        }
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error)
        return {
            documents: [],
            total: 0,
            totalPages: 0
        }
    }
}

export const addNewVirtualProduct = action
    .use(authMiddleware)
    .schema(VirtualProductSchema)
    .action(async ({ parsedInput: values, ctx }) => {
        const rollback = new AppwriteRollback(ctx.storage, ctx.databases)

        try {
            const isValidPrice = values.sellingPrice > values.purchasePrice;
            if (!isValidPrice) throw new Error("Price must be greater than original price");

            const getExistingCloneedProduct = await ctx.databases.listDocuments(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                [
                    Query.and([
                        Query.equal("virtualStoreId", values.storeId),
                        Query.equal("originalProductId", values.originalProductId)
                    ])
                ]
            );

            if (getExistingCloneedProduct.total > 0) {
                throw new Error("Product already cloned")
            }

            const droppedProduct = await ctx.databases.createDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                ID.unique(),
                {
                    createdBy: ctx.user.$id,
                    virtualStoreId: values.storeId,
                    sellingPrice: values.sellingPrice,
                    purchasePrice: values.purchasePrice,
                    title: values.title,
                    description: values.description,
                    generalImageUrls: values.generalImageUrls,
                    originalProductId: values.originalProductId,
                    virtualStore: values.storeId,
                    currency: values.currency
                }
            );

            await rollback.trackDocument(VIRTUAL_PRODUCT_ID, droppedProduct.$id)
            revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page')
            return { success: 'Product successfully added to your store' };
        } catch (error) {
            console.log("addNewVirtualProduct eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to drop new product" };
        }
    });

export const removeProduct = action
    .use(authMiddleware)
    .schema(deleteVirtualProductSchema)
    .action(async ({ parsedInput: { productId }, ctx }) => {
        try {
            await ctx.databases.deleteDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                productId
            );

            revalidatePath('/admin/stores/[storeId]/products/clone-products', 'page')
        } catch (error) {
            console.log("removeProduct", error)
            return { error: error instanceof Error ? error.message : "Failed to delete product" };
        }
    })

export const getAllVirtualPropByOriginalProduct = async (originalProductId: string) => {
    try {
        const { databases } = await createSessionClient()
        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                Query.equal("originalProductId", originalProductId)
            ]
        );

        return products
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to fetch products",
            total: 0,
            documents: []
        };
    }
}

export const searchVirtualProducts = async ({ query, limit = 10 }: { query: string, limit: number }) => {
    try {
        const { databases } = await createSessionClient();

        const results = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            [
                Query.or([
                    Query.search("title", query),
                    Query.contains("categoryNames", query),
                ]),
                Query.limit(limit)
            ]
        );

        return results
    } catch (error) {
        return {
            error:
                error instanceof Error ? error.message : "Failed to search products",
            total: 0,
            documents: []
        };
    }
}

export const getPaginatedVirtualProducts = async ({ searchParams, storeId }: { searchParams: VirtualProductsSearchParams, storeId?: string }) => {
    try {
        const { databases } = await createSessionClient();
        const queries = [Query.limit(5)];

        if (storeId) {
            queries.push(Query.equal("virtualStoreId", storeId))
        }

        if (searchParams.category && searchParams.category !== '') {
            queries.push(Query.search('categoryNames', searchParams.category));
        }

        if (searchParams.minPrice !== undefined && parseFloat(searchParams.minPrice) > 0) {
            queries.push(Query.greaterThanEqual('sellingPrice', parseFloat(searchParams.minPrice)));
        }

        if (searchParams.maxPrice !== undefined && parseFloat(searchParams.maxPrice) < 60000) {
            queries.push(Query.lessThanEqual('sellingPrice', parseFloat(searchParams.maxPrice)));
        }

        let sortDirection = 'DESC';
        let sortField = '$createdAt';

        switch (searchParams.sortBy) {
            case SortBy.priceLowToHigh:
                sortField = 'sellingPrice';
                sortDirection = 'ASC';
                queries.push(Query.orderAsc('sellingPrice'));
                break;
            case SortBy.priceHighToLow:
                sortField = 'sellingPrice';
                sortDirection = 'DESC';
                queries.push(Query.orderDesc('sellingPrice'));
                break;
            case SortBy.newestFirst:
            default:
                sortField = '$createdAt';
                sortDirection = 'DESC';
                queries.push(Query.orderDesc('$createdAt'));
                break;
        }

        if (searchParams.lastId && searchParams.lastId !== '') {
            const lastDoc = await databases.getDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                searchParams.lastId
            );

            if (sortDirection === 'DESC') {
                queries.push(Query.lessThan(sortField, lastDoc[sortField]));
            } else {
                queries.push(Query.greaterThan(sortField, lastDoc[sortField]));
            }
        } else if (searchParams.firstId && searchParams.firstId !== '') {
            const firstDoc = await databases.getDocument(
                DATABASE_ID,
                VIRTUAL_PRODUCT_ID,
                searchParams.firstId
            );

            if (sortDirection === 'DESC') {
                queries.push(Query.greaterThan(sortField, firstDoc[sortField]));
            } else {
                queries.push(Query.lessThan(sortField, firstDoc[sortField]));
            }
        }

        const products = await databases.listDocuments<VirtualProductTypes>(
            DATABASE_ID,
            VIRTUAL_PRODUCT_ID,
            queries
        );

        return products;
    } catch (error) {
        console.log("getVirtualStoreProducts: ", error);
        return {
            total: 0,
            documents: []
        };
    }
};