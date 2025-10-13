import { catalogData } from "@/data/catalog-data";
import { createAdminClient } from "../appwrite";
import { CATEGORIES_COLLECTION_ID, DATABASE_ID, SUB_CATEGORIES_ID } from "../env-config";

function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
        .trim();
};

const CREATED_BY = "685fcbd60004a06594e4";

async function seedCategories() {
    const { databases } = await createAdminClient();

    console.log('Starting category seeding...');
    const createdCategories: Record<string, string> = {};

    for (let i = 0; i < catalogData.categories.length; i++) {
        const category = catalogData.categories[i];

        try {
            const categoryDocument = await databases.createDocument(
                DATABASE_ID,
                CATEGORIES_COLLECTION_ID,
                `${category.id}`,
                {
                    categoryName: category.name,
                    slug: createSlug(category.name),
                    createdBy: CREATED_BY,
                    storeId: null,
                    isActive: true,
                    sortOrder: i + 1,
                    iconUrl: category.iconUrl,
                    iconFileId: null
                }
            );

            createdCategories[category.id] = categoryDocument.$id;

            console.log(`✅ Created category: ${category.name} (${categoryDocument.$id})`);
        } catch (error) {
            console.error(`❌ Failed to create category ${category.name}:`, error);
        }
    }

    return createdCategories;
};

async function seedSubcategories(categoryMapping: Record<string, string>) {
    const { databases } = await createAdminClient();

    console.log('Starting subcategory seeding...');

    for (const category of catalogData.categories) {
        const parentCategoryId = categoryMapping[category.id];

        if (!parentCategoryId) {
            console.error(`❌ Parent category ID not found for: ${category.name}`);
            continue;
        }

        for (const subcategory of category.subcategories) {
            try {
                const subcategoryDocument = await databases.createDocument(
                    DATABASE_ID,
                    SUB_CATEGORIES_ID,
                    `${subcategory.id}`,
                    {
                        subCategoryName: subcategory.name,
                        slug: createSlug(subcategory.name),
                        categoryId: parentCategoryId,
                        parentCategoryId: parentCategoryId,
                        createdBy: CREATED_BY,
                        isActive: true,
                        productTypes: subcategory.productTypes.map(type => type),
                        iconUrl: subcategory.iconUrl,
                        iconFileId: null
                    }
                );

                console.log(`✅ Created subcategory: ${subcategory.name} under ${category.name} (${subcategoryDocument.$id})`);
            } catch (error) {
                console.error(`❌ Failed to create subcategory ${subcategory.name}:`, error);
            }
        }
    }
};

export async function seedProductCatalog() {
    try {
        console.log('🌱 Starting product catalog seeding...');
        const categoryMapping = await seedCategories();
        await seedSubcategories(categoryMapping);
        console.log('🎉 Product catalog seeding completed successfully!');

        return {
            success: true,
            message: 'Product catalog seeded successfully',
            categoriesCreated: Object.keys(categoryMapping).length,
            subcategoriesCreated: catalogData.categories.reduce((total, cat) => total + cat.subcategories.length, 0)
        };
    } catch (error) {
        console.error('💥 Seeding failed:', error);
        return {
            success: false,
            message: 'Seeding failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}