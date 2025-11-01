import { ID } from "node-appwrite";
import { AppwriteRollback } from "../actions/rollback";
import { createSessionClient } from "../appwrite";
import { BaseModel, PaginationResult, QueryFilter, QueryOptions } from "../core/database";
import { COLOR_VARIANTS_COLLECTION_ID, PRODUCTS_BUCKET_ID } from "../env-config";
import { CreateColorVariantData, UpdateColorVariantData } from "../schemas/products-schems";
import { ProductColors } from "../types/appwrite-types";
import { getAuthState } from "../user-permission";
import { ProductsStorageService } from "./storage-models";
import { extractFileIdFromUrl } from "../utils";

export class ColorVariantsModel extends BaseModel<ProductColors> {
    private storageService: ProductsStorageService;

    constructor() {
        super(COLOR_VARIANTS_COLLECTION_ID);
        this.storageService = new ProductsStorageService();
    }

    async findByProduct(
        productId: string,
        options: QueryOptions = {}
    ): Promise<PaginationResult<ProductColors>> {
        const filters: QueryFilter[] = [
            { field: "productId", operator: "equal", value: productId },
            ...(options.filters || [])
        ];

        return this.findMany({
            ...options,
            filters,
            orderBy: "isDefault",
            orderType: "desc"
        });
    }

    async findDefaultColorForProduct(productId: string): Promise<ProductColors | null> {
        const filters: QueryFilter[] = [
            { field: "productId", operator: "equal", value: productId },
            { field: "isDefault", operator: "equal", value: true }
        ];

        return this.findOne(filters);
    }

    async createColorVariant(data: CreateColorVariantData, createdBy: string): Promise<ProductColors | { error: string }> {
        const { storage, databases } = await createSessionClient();
        const rollback = await new AppwriteRollback(storage, databases);

        try {
            const existingColor = await this.findOne([
                { field: "productId", operator: "equal", value: data.productId },
                { field: "colorName", operator: "equal", value: data.colorName }
            ]);

            if (existingColor) {
                return { error: `Color "${data.colorName}" already exists for this product` };
            }

            const imageUrls: string[] = [];
            if (data.images && data.images.length > 0) {
                for (const image of data.images) {
                    const uploadedImage = await this.storageService.uploadFile(image);
                    await rollback.trackFile(PRODUCTS_BUCKET_ID, uploadedImage.$id);

                    const imageUrl = await this.storageService.getFileUrl(uploadedImage.$id, 'view');
                    imageUrls.push(imageUrl);
                }
            }

            if (data.isDefault) {
                await this.unsetDefaultsForProduct(data.productId);
            }

            const colorVariantData = {
                productId: data.productId,
                colorName: data.colorName,
                colorCode: data.colorCode,
                images: imageUrls,
                additionalPrice: data.additionalPrice || 0,
                isDefault: data.isDefault || false,
            };

            const newColorVariant = await this.create(colorVariantData, createdBy);
            await rollback.trackDocument(COLOR_VARIANTS_COLLECTION_ID, newColorVariant.$id);
            return newColorVariant as ProductColors;
        } catch (error) {
            rollback.rollback()
            console.error("setDefaultColor error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to set default color" };
        }
    }

    private async unsetDefaultsForProduct(productId: string): Promise<void> {
        try {
            const filters: QueryFilter[] = [
                { field: "productId", operator: "equal", value: productId },
                { field: "isDefault", operator: "equal", value: true }
            ];

            const defaultColors = await this.findMany({ filters });

            for (const colorVariant of defaultColors.documents) {
                await this.update(colorVariant.$id, { isDefault: false })
            }
        } catch (error) {
            console.error("unsetDefaultsForProduct error: ", error);
        }
    }

    async updateColorVariant(
        colorVariantId: string,
        data: UpdateColorVariantData
    ): Promise<ProductColors | { error: string }> {
        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const existingColorVariant = await this.findById(colorVariantId, {});
            if (!existingColorVariant) {
                return { error: "Color variant not found" };
            }

            let updatedImages = existingColorVariant.images || [];

            if (data.removeImageIds && data.removeImageIds.length > 0) {
                for (const imageUrl of data.removeImageIds) {
                    const fileId = extractFileIdFromUrl(imageUrl);
                    if (fileId) {
                        await this.storageService.deleteFile(fileId);
                        updatedImages = updatedImages.filter(url => url !== imageUrl)
                    }
                }
            }

            if (data.newImages && data.newImages.length > 0) {
                for (const image of data.newImages) {
                    const uploadedImage = await this.storageService.uploadFile(image);
                    const imageUrl = await this.storageService.getFileUrl(uploadedImage.$id, 'view');
                    updatedImages.push(imageUrl);
                }
            }

            if (data.isDefault) {
                await this.unsetDefaultsForProduct(existingColorVariant.productId);
            }

            const updateData = {
                ...data,
                images: updatedImages,
                newImages: undefined,
                removeImageIds: undefined
            }

            const updatedColorVariant = await this.update(colorVariantId, updateData);
            return updatedColorVariant;
        } catch (error) {
            console.error("updateColorVariant error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to update color variant" };
        }
    }

    async deleteColorVariant(colorVariantId: string): Promise<{ success?: string; error?: string }> {
        try {
            const { user } = await getAuthState();
            if (!user) {
                return { error: "Authentication required" };
            }

            const colorVariant = await this.findById(colorVariantId, {});
            if (!colorVariant) {
                return { error: "Color variant not found" };
            }

            if (colorVariant.images && colorVariant.images.length > 0) {
                await Promise.all(
                    colorVariant.images.map(async (imageUrl: string) => {
                        const fileId = extractFileIdFromUrl(imageUrl);
                        if (fileId) {
                            await this.storageService.deleteFile(fileId);
                        }
                    })
                )
            };

            await this.delete(colorVariantId);

            return { success: `Color variant "${colorVariant.colorName}" deleted successfully` };
        } catch (error) {
            console.error("deleteColorVariant error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to delete color variant" };
        }
    }

    async deleteColorVariantsByProduct(productId: string): Promise<{ success?: string; error?: string }> {
        try {
            const colorVariants = await this.findByProduct(productId);
            if (colorVariants.documents.length === 0) {
                return { success: "No color variants to delete" };
            }

            for (const colorVariant of colorVariants.documents) {
                await this.deleteColorVariant(colorVariant.$id);
            }

            return { success: `${colorVariants.documents.length} color variant(s) deleted successfully` };
        } catch (error) {
            console.error("deleteColorVariantsByProduct error: ", error);
            if (error instanceof Error) {
                return { error: error.message };
            }
            return { error: "Failed to delete color variants" };
        }
    }
}