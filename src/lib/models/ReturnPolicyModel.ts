import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "../appwrite";
import { BaseModel, PaginationResult } from "../core/database";
import { DATABASE_ID, RETURN_POLICIES_COLLECTION_ID } from "../env-config";
import { ReturnPolicies } from "../types/appwrite/appwrite";
import { getAuthState } from "../user-permission";
import { checkStoreAccess } from "../helpers/store-permission-helper";

export class ReturnPolicyModel extends BaseModel<ReturnPolicies> {
  constructor() {
    super(RETURN_POLICIES_COLLECTION_ID);
  }

  async createPolicy(data: any): Promise<ReturnPolicies | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        data.storeId,
        "store.settings"
      );

      if (!hasPermission) {
        return { error: "You don't have permission to manage return policies" };
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await this.unsetDefaultPolicies(data.storeId);
      }

      const policy = await this.create(data, user.$id);

      return policy;
    } catch (error) {
      console.error("createPolicy error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to create return policy" };
    }
  }

  async getApplicablePolicy(
    storeId: string,
    productId?: string,
    categoryId?: string
  ): Promise<ReturnPolicies | null> {
    try {
      const { databases } = await createSessionClient();

      // Priority 1: Product-specific policy
      if (productId) {
        const productPolicies = await this.findMany({
          filters: [
            { field: "storeId", operator: "equal", value: storeId },
            { field: "productId", operator: "equal", value: productId },
          ],
          limit: 1,
        });

        if (productPolicies.documents.length > 0) {
          return productPolicies.documents[0];
        }
      }

      // Priority 2: Category-specific policy
      if (categoryId) {
        const categoryPolicies = await this.findMany({
          filters: [
            { field: "storeId", operator: "equal", value: storeId },
            { field: "categoryId", operator: "equal", value: categoryId },
          ],
          limit: 1,
        });

        if (categoryPolicies.documents.length > 0) {
          return categoryPolicies.documents[0];
        }
      }

      // Priority 3: Default store policy
      const defaultPolicies = await this.findMany({
        filters: [
          { field: "storeId", operator: "equal", value: storeId },
          { field: "isDefault", operator: "equal", value: true },
        ],
        limit: 1,
      });

      return defaultPolicies.documents[0] || null;
    } catch (error) {
      console.error("getApplicablePolicy error:", error);
      return null;
    }
  }

  async getStorePolicies(
    storeId: string
  ): Promise<PaginationResult<ReturnPolicies>> {
    return this.findMany({
      filters: [{ field: "storeId", operator: "equal", value: storeId }],
      orderBy: "isDefault",
      orderType: "desc",
      limit: 100,
    });
  }

  async updatePolicy(
    policyId: string,
    data: any
  ): Promise<ReturnPolicies | { error: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const existing = await this.findById(policyId, {});
      if (!existing) {
        return { error: "Policy not found" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        existing.storeId,
        "store.settings"
      );

      if (!hasPermission) {
        return { error: "You don't have permission to update this policy" };
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await this.unsetDefaultPolicies(existing.storeId);
      }

      const updated = await this.update(policyId, data);
      return updated;
    } catch (error) {
      console.error("updatePolicy error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to update policy" };
    }
  }

  async deletePolicy(
    policyId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      const { user } = await getAuthState();
      if (!user) {
        return { error: "Authentication required" };
      }

      const policy = await this.findById(policyId, {});
      if (!policy) {
        return { error: "Policy not found" };
      }

      const hasPermission = await checkStoreAccess(
        user.$id,
        policy.storeId,
        "store.settings"
      );

      if (!hasPermission) {
        return { error: "You don't have permission to delete this policy" };
      }

      if (policy.isDefault) {
        return {
          error:
            "Cannot delete default policy. Set another policy as default first.",
        };
      }

      await this.delete(policyId);
      return { success: "Policy deleted successfully" };
    } catch (error) {
      console.error("deletePolicy error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete policy" };
    }
  }

  async deletePoliciesByStore(
    storeId: string
  ): Promise<{ success?: string; error?: string }> {
    try {
      const policies = await this.findMany({
        filters: [{ field: "storeId", operator: "equal", value: storeId }],
        limit: 1000,
      });

      if (policies.documents.length === 0) {
        return { success: "No policies to delete" };
      }

      // Delete in batches
      const batchSize = 10;
      for (let i = 0; i < policies.documents.length; i += batchSize) {
        await Promise.all(
          policies.documents
            .slice(i, i + batchSize)
            .map((policy) => this.delete(policy.$id))
        );
      }

      return {
        success: `${policies.documents.length} policy(ies) deleted successfully`,
      };
    } catch (error) {
      console.error("deletePoliciesByStore error:", error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Failed to delete policies" };
    }
  }

  private async unsetDefaultPolicies(storeId: string): Promise<void> {
    try {
      const defaultPolicies = await this.findMany({
        filters: [
          { field: "storeId", operator: "equal", value: storeId },
          { field: "isDefault", operator: "equal", value: true },
        ],
        limit: 100,
      });

      for (const policy of defaultPolicies.documents) {
        await this.update(policy.$id, { isDefault: false });
      }
    } catch (error) {
      console.error("unsetDefaultPolicies error:", error);
    }
  }
}
