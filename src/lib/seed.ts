// app/actions/seed-database.js
'use server'

import { ID } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { DATABASE_ID, ORIGINAL_PRODUCT_ID } from "./env-config";

export async function seedProducts({ userId, storeId }: { storeId: string, userId: string }) {
    const { databases } = await createAdminClient()

    // Configuration from environment variables
    const PRODUCTS_API = 'https://api.escuelajs.co/api/v1/products';
    const PRODUCTS_TO_FETCH = 20;
    const categories = ["67bd92b5002c66c5d4f0", "67bd927300076cdc2440", "67bd924e0018aa3d5607"];

    try {
        // Fetch products from the API
        const response = await fetch(PRODUCTS_API);

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const allProducts = await response.json();
        const products = allProducts.slice(0, PRODUCTS_TO_FETCH);

        console.log(`Fetched ${products.length} products. Starting database population...`);

        const successfullyAdded = [];
        const errors = [];

        // Add each product to the database
        for (const product of products) {
            try {
                // Transform the product data to match your collection structure
                const productData = {
                    title: product.title,
                    price: product.price,
                    description: product.description,
                    categoryId: product.category.id,
                    categoryName: product.category.name,
                    categorySlug: product.category.slug,
                    categoryImage: product.category.image,
                    images: product.images,
                };

                // Create the document in Appwrite
                const result = await databases.createDocument(
                    DATABASE_ID,
                    ORIGINAL_PRODUCT_ID,
                    ID.unique(),
                    {
                        title: productData.title,
                        description: productData.description,
                        price: productData.price,
                        createdBy: userId,
                        imageUrls: productData.images,
                        store: storeId,
                        category: categories[Math.floor(Math.random() * categories.length)],
                        seeded: true,
                    }
                );

                successfullyAdded.push(result.$id);
                console.log(`Added product: ${product.title} (ID: ${result.$id})`);
            } catch (docError) {
                console.error(`Error adding product "${product.title}":`, docError);
                errors.push({
                    product: product.title,
                    error: docError instanceof Error ? docError.message : docError
                });
            }
        }

        // Return a summary of the operation
        return {
            success: true,
            added: successfullyAdded.length,
            failed: errors.length,
            productIds: successfullyAdded,
            errors: errors.length > 0 ? errors : undefined
        };

    } catch (error) {
        console.error('Failed to seed database:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : error
        };
    }
}