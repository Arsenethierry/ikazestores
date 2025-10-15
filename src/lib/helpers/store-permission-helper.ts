"use server";

import { createSessionClient } from "../appwrite";
import { StoreRole } from "../constants";
import { PhysicalStoreModel } from "../models/physical-store-model";
import { VirtualStore } from "../models/virtual-store";

export async function isUserStoreOwner(
  userId: string,
  storeId: string,
  storeType?: "physical" | "virtual"
): Promise<boolean> {
  try {
    const { teams } = await createSessionClient();

    try {
      const memberships = await teams.listMemberships(storeId);
      const userMembership = memberships.memberships.find(
        (m) => m.userId === userId
      );

      if (userMembership?.roles?.includes(StoreRole.OWNER)) {
        return true;
      }
    } catch (error) {
      console.log("Team membership check skipped:", error);
    }

    if (!storeType) {
      try {
        const physicalStore = new PhysicalStoreModel();
        const storeData = await physicalStore.findById(storeId, {});
        if (storeData && storeData.owner === userId) {
          return true;
        }
      } catch (error) {}

      try {
        const virtualStore = new VirtualStore();
        const storeData = await virtualStore.findById(storeId, {});
        if (storeData && storeData.owner === userId) {
          return true;
        }
      } catch (error) {}

      return false;
    }

    const store =
      storeType === "physical"
        ? await new PhysicalStoreModel().findById(storeId, {})
        : await new VirtualStore().findById(storeId, {});

    if (!store) return false;

    return store.owner === userId;
  } catch (error) {
    console.error("Error checking store ownership:", error);
    return false;
  }
}

export async function checkStoreAccess(
  userId: string,
  storeId: string,
  permission: string,
  storeType?: "physical" | "virtual"
): Promise<boolean> {
  try {
    const isOwner = await isUserStoreOwner(userId, storeId, storeType);
    if (isOwner) {
      // Store owner bypasses ALL permission checks
      return true;
    }

    const { StoreStaffModel } = await import("../models/staff-models");
    const staffModel = new StoreStaffModel();

    return await staffModel.checkPermission(userId, storeId, permission);
  } catch (error) {
    console.error("Error checking store access:", error);
    return false;
  }
}

export async function checkStorePermissions(
  userId: string,
  storeId: string,
  permissions: string[],
  storeType?: "physical" | "virtual"
): Promise<{ [key: string]: boolean }> {
  try {
    const isOwner = await isUserStoreOwner(userId, storeId, storeType);

    const result: { [key: string]: boolean } = {};

    if (isOwner) {
      // Store owner has ALL permissions
      permissions.forEach((permission) => {
        result[permission] = true;
      });
      return result;
    }

    const { StoreStaffModel } = await import("../models/staff-models");
    const staffModel = new StoreStaffModel();

    for (const permission of permissions) {
      result[permission] = await staffModel.checkPermission(
        userId,
        storeId,
        permission
      );
    }

    return result;
  } catch (error) {
    console.error("Error checking store permissions:", error);
    const result: { [key: string]: boolean } = {};
    permissions.forEach((permission) => {
      result[permission] = false;
    });
    return result;
  }
}
