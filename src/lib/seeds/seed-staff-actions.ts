"use server";

import { createSafeActionClient } from "next-safe-action";
import z from "zod";
import { authMiddleware } from "../actions/middlewares";
import { getAuthState } from "../user-permission";
import { StorePermissionsModel, StoreRolesModel } from "../models/staff-models";
import { seedDefaultPermissions } from "./default-permissions-seed";
import { seedDefaultRolesForStore } from "./default-roles-seed";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Seed staff action error:", error);
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

const SeedStaffSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  storeType: z.enum(["physical", "virtual"]),
});

export interface SeedProgress {
  step: string;
  status: "pending" | "processing" | "completed" | "error";
  message: string;
  count?: number;
}

export const seedStaffAndRolesAction = action
  .use(authMiddleware)
  .schema(SeedStaffSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { storeId, storeType } = parsedInput;

    try {
      // Check permissions - only store owners can seed
      const auth = await getAuthState();
      const storeRole = auth.getStoreRole(storeId);

      if (!storeRole || storeRole !== "owner") {
        return {
          success: false,
          error: "Only store owners can seed staff roles and permissions",
        };
      }

      const progress: SeedProgress[] = [];
      const permissionsModel = new StorePermissionsModel();
      const rolesModel = new StoreRolesModel();

      // Step 1: Check and seed global permissions
      progress.push({
        step: "permissions",
        status: "processing",
        message: "Checking global permissions...",
      });

      try {
        const existingPermissions = await permissionsModel.getAllPermissions();

        if (existingPermissions.length === 0) {
          await seedDefaultPermissions();
          const newPermissions = await permissionsModel.getAllPermissions();
          progress[progress.length - 1] = {
            step: "permissions",
            status: "completed",
            message: "Global permissions seeded successfully",
            count: newPermissions.length,
          };
        } else {
          progress[progress.length - 1] = {
            step: "permissions",
            status: "completed",
            message: "Global permissions already exist",
            count: existingPermissions.length,
          };
        }
      } catch (error) {
        progress[progress.length - 1] = {
          step: "permissions",
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to seed permissions",
        };
        throw error;
      }

      // Step 2: Check and seed store-specific roles
      progress.push({
        step: "roles",
        status: "processing",
        message: "Checking store roles...",
      });

      try {
        const existingRoles = await rolesModel.getStoreRoles(storeId);
        const defaultRolesCount = storeType === "physical" ? 9 : 5;

        if (existingRoles.length === 0) {
          await seedDefaultRolesForStore(storeId, storeType, user.$id);
          const newRoles = await rolesModel.getStoreRoles(storeId);

          progress[progress.length - 1] = {
            step: "roles",
            status: "completed",
            message: `Default roles created for ${storeType} store`,
            count: newRoles.length,
          };
        } else {
          progress[progress.length - 1] = {
            step: "roles",
            status: "completed",
            message: "Store roles already exist",
            count: existingRoles.length,
          };
        }
      } catch (error) {
        progress[progress.length - 1] = {
          step: "roles",
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to seed roles",
        };
        throw error;
      }

      // Step 3: Verify seeding completion
      progress.push({
        step: "verification",
        status: "processing",
        message: "Verifying seed data...",
      });

      try {
        const [permissions, roles] = await Promise.all([
          permissionsModel.getAllPermissions(),
          rolesModel.getStoreRoles(storeId),
        ]);

        if (permissions.length > 0 && roles.length > 0) {
          progress[progress.length - 1] = {
            step: "verification",
            status: "completed",
            message: "Seed verification completed successfully",
          };
        } else {
          throw new Error("Verification failed: Missing data");
        }
      } catch (error) {
        progress[progress.length - 1] = {
          step: "verification",
          status: "error",
          message:
            error instanceof Error ? error.message : "Verification failed",
        };
        throw error;
      }

      // Revalidate the staff pages
      revalidatePath(`/admin/stores/${storeId}/staff`);
      revalidatePath(`/admin/stores/${storeId}/staff/seed-staff`);

      return {
        success: true,
        message: "Staff roles and permissions seeded successfully",
        progress,
      };
    } catch (error) {
      console.error("Seed staff and roles error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to seed staff data",
      };
    }
  });
