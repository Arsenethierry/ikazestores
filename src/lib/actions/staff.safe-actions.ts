"use server";

import { createSafeActionClient } from "next-safe-action";
import { StaffEmailService } from "../models/staff-email-templates";
import {
  StaffInvitationsModel,
  StorePermissionsModel,
  StoreRolesModel,
  StoreStaffModel,
} from "../models/staff-models";
import { authMiddleware } from "./middlewares";
import {
  AcceptInvitationSchema,
  CreateCustomRoleSchema,
  DeleteRoleSchema,
  InvitationOperationSchema,
  InviteStaffSchema,
  RemoveStaffSchema,
  UpdateRoleSchema,
  UpdateStaffSchema,
} from "../schemas/staff-schemas";
import { revalidatePath } from "next/cache";
import { PhysicalStoreModel } from "../models/physical-store-model";
import { VirtualStore } from "../models/virtual-store";
import { PhysicalStoreTypes, VirtualStoreTypes } from "../types";
import { getLoggedInUser } from "./auth.action";
import { redirect } from "next/navigation";
import {
  DATABASE_ID,
  PHYSICAL_STORE_ID,
  STORE_ROLES_ID,
  VIRTUAL_STORE_ID,
} from "../env-config";
import { createSessionClient } from "../appwrite";

const staffModel = new StoreStaffModel();
const rolesModel = new StoreRolesModel();
const invitationsModel = new StaffInvitationsModel();
const permissionsModel = new StorePermissionsModel();
const staffEmailService = new StaffEmailService();

const action = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Staff action error:", error);
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

export const inviteStaffAction = action
  .use(authMiddleware)
  .schema(InviteStaffSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, databases } = ctx;

    try {
      // Check if user has permission to invite staff
      const hasPermission = await staffModel.checkPermission(
        user.$id,
        parsedInput.storeId,
        "staff.invite"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to invite staff",
        };
      }

      // Create invitation
      const invitation = await invitationsModel.createInvitation({
        storeId: parsedInput.storeId,
        storeType: parsedInput.storeType,
        email: parsedInput.email,
        roleId: parsedInput.roleId,
        invitedBy: user.$id,
      });

      // Get role and store details for email
      const [roles, store] = await Promise.all([
        rolesModel.getStoreRoles(parsedInput.storeId),
        databases.getDocument(
          DATABASE_ID,
          parsedInput.storeType === "physical"
            ? "physicical_store"
            : "virtual_store",
          parsedInput.storeId
        ),
      ]);

      const selectedRole = roles.find((r) => r.$id === parsedInput.roleId);

      // Send invitation email
      await staffEmailService.sendStaffInvitationEmail({
        to: parsedInput.email,
        storeName: store.storeName,
        storeType: parsedInput.storeType,
        roleName: selectedRole?.roleName || "Staff Member",
        inviterName: user.name || user.email,
        invitationToken: invitation.invitationToken,
        expiresAt: new Date(invitation.expiresAt),
        customMessage: parsedInput.customMessage,
      });

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff`);

      return {
        success: true,
        data: invitation,
        message: "Invitation sent successfully!",
      };
    } catch (error) {
      console.error("Invite staff error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to invite staff",
      };
    }
  });

export const acceptInvitationAction = action
  .schema(AcceptInvitationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const user = await getLoggedInUser();
      if (!user) {
        redirect(
          "/sign-in?redirect=/accept-invitation?token=" + parsedInput.token
        );
      }

      // Accept invitation and create staff record
      const staffRecord = await invitationsModel.acceptInvitation(
        parsedInput.token,
        user.$id
      );

      const { databases } = await createSessionClient();

      const [store, role] = await Promise.all([
        databases.getDocument(
          DATABASE_ID,
          staffRecord.storeType === "physical"
            ? PHYSICAL_STORE_ID
            : VIRTUAL_STORE_ID,
          staffRecord.storeId
        ),
        databases.getDocument(DATABASE_ID, STORE_ROLES_ID, staffRecord.roleId),
      ]);

      // Send welcome email
      await staffEmailService.sendStaffWelcomeEmail({
        to: user.email,
        userName: user.name || user.email.split("@")[0],
        storeName: store.storeName,
        storeType: staffRecord.storeType as any,
        roleName: role.roleName,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/store/${staffRecord.storeId}`,
      });

      revalidatePath("/dashboard");
      redirect(`/dashboard/store/${staffRecord.storeId}`);
    } catch (error) {
      console.error("Accept invitation error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation",
      };
    }
  });

export const cancelInvitationAction = action
  .use(authMiddleware)
  .schema(InvitationOperationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    try {
      const hasPermission = await staffModel.checkPermission(
        user.$id,
        parsedInput.storeId,
        "staff.invite"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to cancel invitations",
        };
      }

      await invitationsModel.cancelInvitation(parsedInput.invitationId);

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff`);

      return {
        success: true,
        message: "Invitation cancelled successfully",
      };
    } catch (error) {
      console.error("Cancel invitation error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel invitation",
      };
    }
  });

export const resendInvitationAction = action
  .use(authMiddleware)
  .schema(InvitationOperationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, databases } = ctx;

    try {
      const hasPermission = await staffModel.checkPermission(
        user.$id,
        parsedInput.storeId,
        "staff.invite"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to resend invitations",
        };
      }

      const invitation = await invitationsModel.resendInvitation(
        parsedInput.invitationId
      );

      const [role, store] = await Promise.all([
        databases.getDocument(DATABASE_ID, STORE_ROLES_ID, invitation.roleId),
        databases.getDocument(
          DATABASE_ID,
          invitation.storeType === "physical"
            ? PHYSICAL_STORE_ID
            : VIRTUAL_STORE_ID,
          invitation.storeId
        ),
      ]);

      await staffEmailService.sendStaffInvitationEmail({
        to: invitation.email,
        storeName: store.storeName,
        storeType: invitation.storeType as any,
        roleName: role.roleName,
        inviterName: user.name || user.email,
        invitationToken: invitation.invitationToken,
        expiresAt: new Date(invitation.expiresAt),
      });

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff`);

      return {
        success: true,
        message: "Invitation resent successfully",
      };
    } catch (error) {
      console.error("Resend invitation error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend invitation",
      };
    }
  });

export const updateStaffMemberAction = action
  .use(authMiddleware)
  .schema(UpdateStaffSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, databases } = ctx;

    try {
      const hasPermission = parsedInput.storeId
        ? await staffModel.checkPermission(
            user.$id,
            parsedInput.storeId,
            "staff.update"
          )
        : false;

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to update staff",
        };
      }

      // Check if role is changing
      let sendRoleChangeEmail = false;
      let oldRoleName = "";
      let newRoleName = "";
      let staffUserEmail = "";
      let staffUserName = "";
      let storeName = "";

      if (parsedInput.roleId && parsedInput.storeId) {
        const currentStaff = await staffModel.getStaffById(parsedInput.staffId);

        if (currentStaff) {
          const [roles, store] = await Promise.all([
            rolesModel.getStoreRoles(parsedInput.storeId),
            databases.getDocument(
              DATABASE_ID,
              currentStaff.storeType === "physical"
                ? PHYSICAL_STORE_ID
                : VIRTUAL_STORE_ID,
              parsedInput.storeId
            ),
          ]);

          oldRoleName = currentStaff.roleName || "";
          const newRole = roles.find((r) => r.$id === parsedInput.roleId);
          newRoleName = newRole?.roleName || "";
          staffUserEmail = currentStaff.userEmail || "";
          staffUserName = currentStaff.userName || "";
          storeName = store.storeName;

          if (oldRoleName !== newRoleName) {
            sendRoleChangeEmail = true;
          }
        }
      }

      const { storeId, ...updates } = parsedInput;
      const updatedStaff = await staffModel.updateStaffMember(
        parsedInput.staffId,
        updates
      );

      // Send role change email if applicable
      if (sendRoleChangeEmail && staffUserEmail) {
        await staffEmailService.sendRoleChangeEmail({
          to: staffUserEmail,
          userName: staffUserName || staffUserEmail.split("@")[0],
          storeName,
          oldRoleName,
          newRoleName,
        });
      }

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff`);

      return {
        success: true,
        data: updatedStaff,
        message: "Staff member updated successfully",
      };
    } catch (error) {
      console.error("Update staff error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update staff member",
      };
    }
  });

export const removeStaffMemberAction = action
  .use(authMiddleware)
  .schema(RemoveStaffSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, databases } = ctx;

    try {
      const hasPermission = await staffModel.checkPermission(
        user.$id,
        parsedInput.storeId,
        "staff.delete"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to remove staff",
        };
      }

      const staffToRemove = await staffModel.getStaffById(parsedInput.staffId);

      if (!staffToRemove) {
        return {
          success: false,
          error: "Staff member not found",
        };
      }

      const store = await databases.getDocument(
        DATABASE_ID,
        staffToRemove.storeType === "physical"
          ? PHYSICAL_STORE_ID
          : VIRTUAL_STORE_ID,
        parsedInput.storeId
      );

      await staffModel.removeStaffMember(parsedInput.staffId);

      if (staffToRemove.userEmail) {
        await staffEmailService.sendStaffRemovedEmail({
          to: staffToRemove.userEmail,
          userName:
            staffToRemove.userName || staffToRemove.userEmail.split("@")[0],
          storeName: store.storeName,
          reason: parsedInput.reason,
        });
      }

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff`);

      return {
        success: true,
        message: "Staff member removed successfully",
      };
    } catch (error) {
      console.error("Remove staff error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove staff member",
      };
    }
  });

export const createCustomRoleAction = action
  .use(authMiddleware)
  .schema(CreateCustomRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const hasPermission = await staffModel.checkPermission(
        user.$id,
        parsedInput.storeId,
        "staff.roles"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to create roles",
        };
      }

      const newRole = await rolesModel.createCustomRole({
        storeId: parsedInput.storeId,
        storeType: parsedInput.storeType,
        roleName: parsedInput.roleName,
        description: parsedInput.description,
        permissions: parsedInput.permissions,
        isCustom: true,
        createdBy: user.$id,
      });

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff/roles`);

      return {
        success: true,
        data: newRole,
        message: `Role "${parsedInput.roleName}" created successfully`,
      };
    } catch (error) {
      console.error("Create role error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create role",
      };
    }
  });

export const updateRoleAction = action
  .use(authMiddleware)
  .schema(UpdateRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const hasPermission = await staffModel.checkPermission(
        user.$id,
        parsedInput.storeId,
        "staff.roles"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to update roles",
        };
      }

      const { roleId, storeId, ...updates } = parsedInput;
      const updatedRole = await rolesModel.updateRole(roleId, updates);

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff/roles`);

      return {
        success: true,
        data: updatedRole,
        message: "Role updated successfully",
      };
    } catch (error) {
      console.error("Update role error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update role",
      };
    }
  });

export const deleteRoleAction = action
  .use(authMiddleware)
  .schema(DeleteRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    try {
      const hasPermission = await staffModel.checkPermission(
        user.$id,
        parsedInput.storeId,
        "staff.roles"
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "You don't have permission to delete roles",
        };
      }

      await rolesModel.deleteRole(parsedInput.roleId);

      revalidatePath(`/dashboard/store/${parsedInput.storeId}/staff/roles`);

      return {
        success: true,
        message: "Role deleted successfully",
      };
    } catch (error) {
      console.error("Delete role error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete role",
      };
    }
  });

export async function getStoreStaffAction(storeId: string) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasPermission = await staffModel.checkPermission(
      user.$id,
      storeId,
      "staff.view"
    );

    if (!hasPermission) {
      return {
        success: false,
        error: "You don't have permission to view staff",
        data: [],
      };
    }

    const staff = await staffModel.getStoreStaff(storeId);

    return { success: true, data: staff };
  } catch (error) {
    console.error("Get store staff error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch staff",
      data: [],
    };
  }
}

export async function getStoreRolesAction(storeId: string) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasPermission = await staffModel.checkPermission(
      user.$id,
      storeId,
      "staff.view"
    );

    if (!hasPermission) {
      return { success: false, error: "You don't have permission to view roles", data: [] };
    }

    const roles = await rolesModel.getStoreRoles(storeId);

    return { success: true, data: roles };
  } catch (error) {
    console.error("Get store roles error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch roles",
      data: [],
    };
  }
}

export async function getStoreInvitationsAction(
  storeId: string,
  status?: "pending" | "accepted" | "expired" | "cancelled"
) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasPermission = await staffModel.checkPermission(
      user.$id,
      storeId,
      "staff.view"
    );

    if (!hasPermission) {
      return {
        success: false,
        error: "You don't have permission to view invitations",
        data: [],
      };
    }

    const invitations = await invitationsModel.getStoreInvitations(storeId, status);

    return { success: true, data: invitations };
  } catch (error) {
    console.error("Get store invitations error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch invitations",
      data: [],
    };
  }
}

export async function getPermissionsForStoreTypeAction(
  storeType: "physical" | "virtual"
) {
  try {
    const permissions = await permissionsModel.getPermissionsForStoreType(storeType);

    return { success: true, data: permissions };
  } catch (error) {
    console.error("Get permissions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch permissions",
      data: [],
    };
  }
}

export async function validateInvitationTokenAction(token: string) {
  try {
    const result = await invitationsModel.validateToken(token);
    return result;
  } catch (error) {
    console.error("Validate token error:", error);
    return { valid: false, message: "Error validating invitation" };
  }
}

export async function checkStaffPermissionAction(
  storeId: string,
  permissionKey: string
) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, hasPermission: false };
    }

    const hasPermission = await staffModel.checkPermission(
      user.$id,
      storeId,
      permissionKey
    );

    return { success: true, hasPermission };
  } catch (error) {
    console.error("Check permission error:", error);
    return { success: false, hasPermission: false };
  }
}

export async function checkStaffPermissionsAction(
  storeId: string,
  permissionKeys: string[]
) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, permissions: {} };
    }

    const permissions: { [key: string]: boolean } = {};

    for (const key of permissionKeys) {
      permissions[key] = await staffModel.checkPermission(user.$id, storeId, key);
    }

    return { success: true, permissions };
  } catch (error) {
    console.error("Check permissions error:", error);
    return { success: false, permissions: {} };
  }
}

export async function getUserStaffStoresAction() {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const stores = await staffModel.getUserStaffStores(user.$id);

    return { success: true, data: stores };
  } catch (error) {
    console.error("Get user staff stores error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stores",
      data: [],
    };
  }
}

export async function updateStaffLastActiveAction(storeId: string) {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { success: false };
    }

    await staffModel.updateLastActive(user.$id, storeId);

    return { success: true };
  } catch (error) {
    console.error("Update last active error:", error);
    return { success: false };
  }
}