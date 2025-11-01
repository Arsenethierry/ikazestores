import { ID, Query } from "node-appwrite";
import { BaseModel } from "../core/database";
import { DATABASE_ID, PRODUCT_BADGES_COLLECTION_ID } from "../env-config";
import {
  BulkCreateBadgesInput,
  CreateProductBadgeInput,
  UpdateProductBadgeInput,
} from "../schemas/discount-schemas";
import { ProductBadges } from "../types/appwrite-types";
import { getAuthState } from "../user-permission";
import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "../appwrite";

export class ProductBadgeModel extends BaseModel<ProductBadges> {
  constructor() {
    super(PRODUCT_BADGES_COLLECTION_ID);
  }

  async createBadge(
    data: CreateProductBadgeInput,
    userId: string
  ): Promise<ProductBadges | { error: string }> {
    try {
      const badge = await this.create(
        {
          ...data,
          isActive: data.isActive ?? true,
          priority: data.priority ?? 0,
        },
        userId
      );

      return badge;
    } catch (error) {
      console.error("createBadge error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to create badge" };
    }
  }

  async bulkCreateBadges(
    data: BulkCreateBadgesInput
  ): Promise<{ success: ProductBadges[]; errors: string[] }> {
    const success: ProductBadges[] = [];
    const errors: string[] = [];

    for (const productId of data.productIds) {
      const badgeData: CreateProductBadgeInput = {
        productId,
        badgeType: data.badgeType,
        label: data.label,
        colorScheme: data.colorScheme,
        startDate: data.startDate,
        endDate: data.endDate,
        priority: data.priority,
        isActive: true,
      };

      const result = await this.createBadge(badgeData);
      if ("error" in result) {
        errors.push(`${productId}: ${result.error}`);
      } else {
        success.push(result);
      }
    }

    return { success, errors };
  }

  async getProductBadges(productId: string): Promise<ProductBadges[]> {
    try {
      const { databases } = await createSessionClient();
      const now = new Date().toISOString();

      const badges = await databases.listDocuments<ProductBadges>(
        DATABASE_ID,
        PRODUCT_BADGES_COLLECTION_ID,
        [Query.equal("productId", productId), Query.equal("isActive", true)]
      );

      // Filter by date range and sort by priority
      return badges.documents
        .filter((badge) => {
          if (badge.startDate && new Date(badge.startDate) > new Date(now)) {
            return false;
          }
          if (badge.endDate && new Date(badge.endDate) < new Date(now)) {
            return false;
          }
          return true;
        })
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));
    } catch (error) {
      console.error("getProductBadges error:", error);
      return [];
    }
  }

  async updateBadge(
    badgeId: string,
    data: UpdateProductBadgeInput
  ): Promise<ProductBadges | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const updated = await this.update(badgeId, data);
      return updated;
    } catch (error) {
      console.error("updateBadge error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update badge" };
    }
  }

  async deleteBadge(
    badgeId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      await this.delete(badgeId);
      return { success: "Badge deleted successfully" };
    } catch (error) {
      console.error("deleteBadge error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete badge" };
    }
  }

  async deleteBadgesByProduct(
    productId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      const badges = await this.findMany({
        filters: [{ field: "productId", operator: "equal", value: productId }],
        limit: 1000,
      });

      if (badges.documents.length === 0) {
        return { success: "No badges to delete" };
      }

      const batchSize = 10;
      for (let i = 0; i < badges.documents.length; i += batchSize) {
        await Promise.all(
          badges.documents
            .slice(i, i + batchSize)
            .map((badge) => this.delete(badge.$id))
        );
      }

      return {
        success: `${badges.documents.length} badge(s) deleted successfully`,
      };
    } catch (error) {
      console.error("deleteBadgesByProduct error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete badges" };
    }
  }

  async syncSaleBadges(
    productId: string,
    hasActiveDiscount: boolean
  ): Promise<void> {
    try {
      const existingBadges = await this.getProductBadges(productId);
      const saleBadge = existingBadges.find((b) => b.badgeType === "sale");

      if (hasActiveDiscount && !saleBadge) {
        // Create sale badge
        await this.createBadge({
          productId,
          badgeType: "sale",
          label: "Sale",
          colorScheme: "red",
          priority: 10,
          isActive: true,
        });
      } else if (!hasActiveDiscount && saleBadge) {
        // Remove sale badge
        await this.deleteBadge(saleBadge.$id);
      }
    } catch (error) {
      console.error("syncSaleBadges error:", error);
    }
  }
}
