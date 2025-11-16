import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { BaseModel, QueryFilter } from "../core/database";
import {
  DATABASE_ID,
  STAFF_INVITATIONS_ID,
  STORE_PERMISSIONS_ID,
  STORE_ROLES_ID,
  STORE_STAFF_ID,
  USER_DATA_ID,
} from "../env-config";
import {
  StaffInvitations,
  StorePermissions,
  StoreRoles,
  StoreStaff,
} from "../types/appwrite-types";
import {
  CreateCustomRoleTypes,
  CreateInvitationTypes,
  CreateStaffTypes,
  UpdateRoleTypes,
  UpdateStaffTypes,
} from "../schemas/staff-schemas";
import { StoreRole } from "../constants";
import { isUserStoreOwner } from "../helpers/store-permission-helper";

export interface EnrichedStaffMember extends StoreStaff {
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  userAvatar?: string;
  roleName?: string;
  roleDescription?: string;
  rolePriority?: number | null;
  isCustomRole?: boolean;
}

function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

function generateUUID(): string {
  return crypto.randomUUID();
}

export class StorePermissionsModel extends BaseModel<StorePermissions> {
  constructor() {
    super(STORE_PERMISSIONS_ID);
  }

  async getPermissionsForStoreType(
    storeType: "physical" | "virtual",
    storeId?: string
  ): Promise<StorePermissions[]> {
    try {
      const { databases } = await createSessionClient();

      const queries = [
        Query.or([
          Query.equal("applicableToStoreType", "both"),
          Query.equal("applicableToStoreType", storeType),
        ]),
      ];

      if (storeId) {
        queries.push(
          Query.or([Query.isNull("storeId"), Query.equal("storeId", storeId)])
        );
      } else {
        queries.push(Query.isNull("storeId"));
      }

      queries.push(Query.limit(200));

      const response = await databases.listDocuments<StorePermissions>(
        DATABASE_ID,
        this.collectionId,
        queries
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }
  }

  async getAllGlobalPermissions(): Promise<StorePermissions[]> {
    try {
      const { databases } = await createSessionClient();

      const response = await databases.listDocuments<StorePermissions>(
        DATABASE_ID,
        this.collectionId,
        [Query.isNull("storeId"), Query.limit(100)]
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching global permissions:", error);
      return [];
    }
  }

  async getStoreCustomPermissions(
    storeId: string
  ): Promise<StorePermissions[]> {
    try {
      const { databases } = await createSessionClient();

      const response = await databases.listDocuments<StorePermissions>(
        DATABASE_ID,
        this.collectionId,
        [Query.equal("storeId", storeId), Query.limit(100)]
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching store custom permissions:", error);
      return [];
    }
  }

  async getPermissionsByModule(
    module: string,
    storeId?: string
  ): Promise<StorePermissions[]> {
    try {
      const queries: any[] = [Query.equal("module", module)];

      if (storeId) {
        queries.push(
          Query.or([Query.isNull("storeId"), Query.equal("storeId", storeId)])
        );
      } else {
        queries.push(Query.isNull("storeId"));
      }

      queries.push(Query.limit(100));

      const result = await this.findMany({
        filters: [],
        limit: 100,
      });

      return result.documents;
    } catch (error) {
      console.error("Error fetching permissions by module:", error);
      return [];
    }
  }

  async createCustomPermission(data: {
    storeId: string;
    permissionKey: string;
    permissionName: string;
    module: string;
    description?: string;
    applicableToStoreType: "physical" | "virtual" | "both";
  }): Promise<StorePermissions> {
    try {
      const { databases } = await createSessionClient();

      const existing = await databases.listDocuments<StorePermissions>(
        DATABASE_ID,
        this.collectionId,
        [
          Query.equal("permissionKey", data.permissionKey),
          Query.or([
            Query.isNull("storeId"),
            Query.equal("storeId", data.storeId),
          ]),
          Query.limit(1),
        ]
      );

      if (existing.total > 0) {
        throw new Error("Permission key already exists");
      }

      const permission = await databases.createDocument<StorePermissions>(
        DATABASE_ID,
        this.collectionId,
        generateUUID(),
        {
          ...data,
          isGlobal: false,
        }
      );

      return permission;
    } catch (error) {
      console.error("Error creating custom permission:", error);
      throw error;
    }
  }

  async deleteCustomPermission(
    permissionId: string,
    storeId: string
  ): Promise<void> {
    try {
      const { databases } = await createSessionClient();

      const permission = await databases.getDocument<StorePermissions>(
        DATABASE_ID,
        this.collectionId,
        permissionId
      );

      // Can't delete global permissions
      if (!permission.storeId || permission.storeId === null) {
        throw new Error("Cannot delete global permissions");
      }

      // Can only delete permissions from your own store
      if (permission.storeId !== storeId) {
        throw new Error("Cannot delete permissions from another store");
      }

      await databases.deleteDocument(
        DATABASE_ID,
        this.collectionId,
        permissionId
      );
    } catch (error) {
      console.error("Error deleting custom permission:", error);
      throw error;
    }
  }
}

export class StoreRolesModel extends BaseModel<StoreRoles> {
  constructor() {
    super(STORE_ROLES_ID);
  }

  async getStoreRoles(storeId: string): Promise<StoreRoles[]> {
    try {
      const { databases } = await createSessionClient();

      const response = await databases.listDocuments<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        [
          Query.or([Query.isNull("storeId"), Query.equal("storeId", storeId)]),
          Query.equal("isActive", true),
          Query.orderAsc("priority"),
          Query.limit(100),
        ]
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching store roles:", error);
      return [];
    }
  }

  async getAllGlobalRoles(): Promise<StoreRoles[]> {
    try {
      const { databases } = await createAdminClient();

      const response = await databases.listDocuments<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        [
          Query.isNull("storeId"),
          Query.equal("isActive", true),
          Query.orderAsc("priority"),
          Query.limit(100),
        ]
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching global roles:", error);
      return [];
    }
  }

  async getStoreCustomRoles(storeId: string): Promise<StoreRoles[]> {
    try {
      const { databases } = await createSessionClient();

      const response = await databases.listDocuments<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        [
          Query.equal("storeId", storeId),
          Query.equal("isActive", true),
          Query.equal("isCustom", true),
          Query.orderAsc("priority"),
          Query.limit(100),
        ]
      );

      return response.documents;
    } catch (error) {
      console.error("Error fetching store custom roles:", error);
      return [];
    }
  }

  async createCustomRole(data: CreateCustomRoleTypes) {
    try {
      const { databases } = await createSessionClient();

      const existing = await databases.listDocuments(
        DATABASE_ID,
        this.collectionId,
        [
          Query.or([
            Query.isNull("storeId"),
            Query.equal("storeId", data.storeId),
          ]),
          Query.equal("roleName", data.roleName),
          Query.limit(1),
        ]
      );

      if (existing.total > 0) {
        throw new Error(`Role "${data.roleName}" already exists in this store`);
      }

      const roleData = {
        ...data,
        isActive: data.isActive ?? true,
        priority: data.priority ?? 10,
        isCustom: true,
      };

      const newRole = await databases.createDocument<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        ID.unique(),
        roleData
      );

      return newRole;
    } catch (error) {
      console.error("Error creating custom role:", error);
      throw error;
    }
  }

  async updateRole(
    roleId: string,
    updates: Partial<Omit<UpdateRoleTypes, "$id">>
  ) {
    try {
      const { databases } = await createSessionClient();

      // Get the role first
      const role = await databases.getDocument<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        roleId
      );

      // Can't update global roles
      if (!role.storeId || role.storeId === null) {
        throw new Error(
          "Cannot update global roles. Only store-specific roles can be modified."
        );
      }

      const updatedRole = await databases.updateDocument<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        roleId,
        updates
      );

      return updatedRole;
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  }

  async deleteRole(roleId: string): Promise<void> {
    try {
      const { databases } = await createAdminClient();

      const role = await databases.getDocument<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        roleId
      );

      if (!role.isCustom) {
        throw new Error("Cannot delete default roles");
      }

      const staffWithRole = await databases.listDocuments(
        DATABASE_ID,
        STORE_STAFF_ID,
        [Query.equal("roleId", roleId), Query.limit(1)]
      );

      if (staffWithRole.total > 0) {
        throw new Error(
          "Cannot delete role that is assigned to staff members. Reassign staff first."
        );
      }

      await this.delete(roleId);
    } catch (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
  }
}

export class StoreStaffModel extends BaseModel<StoreStaff> {
  constructor() {
    super(STORE_STAFF_ID);
  }

  async getStoreStaff(storeId: string): Promise<EnrichedStaffMember[]> {
    try {
      const { databases, users } = await createAdminClient();

      const staffRecords = await databases.listDocuments<StoreStaff>(
        DATABASE_ID,
        this.collectionId,
        [Query.equal("storeId", storeId), Query.orderDesc("$createdAt")]
      );

      // Enrich with user and role data
      const enrichedStaff = await Promise.all(
        staffRecords.documents.map(async (staff) => {
          try {
            const [user, role] = await Promise.all([
              users.get(staff.userId),
              databases.getDocument<StoreRoles>(
                DATABASE_ID,
                STORE_ROLES_ID,
                staff.roleId
              ),
            ]);

            return {
              ...staff,
              userEmail: user.email,
              userName: user.name,
              userPhone: user.phone,
              roleName: role.roleName,
              roleDescription: role.description,
              rolePriority: role.priority,
              isCustomRole: role.isCustom,
            };
          } catch (error) {
            console.error(`Error enriching staff ${staff.$id}:`, error);
            return staff as EnrichedStaffMember;
          }
        })
      );

      return enrichedStaff;
    } catch (error) {
      console.error("Error fetching store staff:", error);
      return [];
    }
  }

  async getStaffByUserId(
    userId: string,
    storeId: string
  ): Promise<StoreStaff | null> {
    try {
      const filters: QueryFilter[] = [
        { field: "storeId", operator: "equal", value: storeId },
        { field: "userId", operator: "equal", value: userId },
      ];

      return await this.findOne(filters);
    } catch (error) {
      console.error("Error fetching staff by user ID:", error);
      return null;
    }
  }

  async getStaffById(staffId: string): Promise<EnrichedStaffMember | null> {
    try {
      const { databases, users } = await createAdminClient();

      const staffRecord = await databases.getDocument<StoreStaff>(
        DATABASE_ID,
        this.collectionId,
        staffId
      );

      if (!staffRecord) {
        return null;
      }

      // Enrich with user and role data
      try {
        const [user, role, userData] = await Promise.all([
          users.get(staffRecord.userId),
          databases.getDocument<StoreRoles>(
            DATABASE_ID,
            STORE_ROLES_ID,
            staffRecord.roleId
          ),
          databases.listDocuments(DATABASE_ID, USER_DATA_ID, [
            Query.equal("userId", staffRecord.userId),
            Query.limit(1),
          ]),
        ]);

        return {
          ...staffRecord,
          userEmail: user.email,
          userName: user.name,
          userPhone: user.phone,
          userAvatar: userData.documents[0]?.avatarUrl || null,
          roleName: role.roleName,
          roleDescription: role.description,
          rolePriority: role.priority,
          isCustomRole: role.isCustom,
        };
      } catch (enrichError) {
        console.error(`Error enriching staff ${staffId}:`, enrichError);
        return staffRecord as EnrichedStaffMember;
      }
    } catch (error) {
      console.error("Error fetching staff by ID:", error);
      return null;
    }
  }

  async createStaffMember(data: CreateStaffTypes) {
    try {
      const { databases, teams } = await createSessionClient();

      // Add user to store team with basic STAFF role
      try {
        await teams.createMembership(
          data.storeId,
          [StoreRole.STAFF],
          undefined, // email
          data.userId
        );
      } catch (teamError) {
        console.error("Error adding to team:", teamError);
        // Continue even if team membership fails
      }

      const staffData = {
        ...data,
        invitedAt: data.invitedAt || new Date().toISOString(),
      };

      const newStaff = await databases.createDocument<StoreStaff>(
        DATABASE_ID,
        this.collectionId,
        ID.unique(),
        staffData
      );

      return newStaff;
    } catch (error) {
      console.error("Error creating staff member:", error);
      throw error;
    }
  }

  async updateStaffMember(
    staffId: string,
    updates: UpdateStaffTypes
  ): Promise<StoreStaff> {
    try {
      return await this.update(staffId, {
        ...updates,
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating staff member:", error);
      throw error;
    }
  }

  async removeStaffMember(staffId: string): Promise<void> {
    try {
      const { databases, teams } = await createSessionClient();

      const staff = await databases.getDocument<StoreRoles>(
        DATABASE_ID,
        this.collectionId,
        staffId
      );

      if (!staff.storeId) return;

      // Remove from Appwrite team
      try {
        const memberships = await teams.listMemberships(staff.storeId);
        const membership = memberships.memberships.find(
          (m) => m.userId === staff.userId
        );

        if (membership) {
          await teams.deleteMembership(staff.storeId, membership.$id);
        }
      } catch (teamError) {
        console.error("Error removing from team:", teamError);
      }

      await this.delete(staffId);
    } catch (error) {
      console.error("Error removing staff member:", error);
      throw error;
    }
  }

  async checkPermission(
    userId: string,
    storeId: string,
    permissionKey: string
  ): Promise<boolean> {
    try {
      if (await isUserStoreOwner(userId, storeId)) {
        return true;
      }

      const staff = await this.getStaffByUserId(userId, storeId);

      if (!staff || !staff.permissions || staff.StoreStaffStatus !== "active") {
        return false;
      }

      return staff.permissions.includes(permissionKey);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  async updateLastActive(userId: string, storeId: string): Promise<void> {
    try {
      const staff = await this.getStaffByUserId(userId, storeId);

      if (staff) {
        await this.update(staff.$id!, {
          lastActive: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating last active:", error);
    }
  }

  async getUserStaffStores(userId: string): Promise<
    Array<{
      storeId: string;
      storeType: string;
      storeName: string;
      storeLogoUrl?: string;
      roleName: string;
      permissions: string[];
      joinedAt: string;
    }>
  > {
    try {
      const { databases } = await createSessionClient();

      const staffRecords = await databases.listDocuments<StoreStaff>(
        DATABASE_ID,
        this.collectionId,
        [
          Query.equal("userId", userId),
          Query.equal("StoreStaffStatus", "active"),
        ]
      );

      const enrichedStores = await Promise.all(
        staffRecords.documents.map(async (staff) => {
          try {
            const storeCollection =
              staff.storeType === "physical"
                ? "physicical_store"
                : "virtual_store";

            const [store, role] = await Promise.all([
              databases.getDocument(
                DATABASE_ID,
                storeCollection,
                staff.storeId
              ),
              databases.getDocument<StoreRoles>(
                DATABASE_ID,
                STORE_ROLES_ID,
                staff.roleId
              ),
            ]);

            return {
              storeId: staff.storeId,
              storeType: staff.storeType,
              storeName: store.storeName,
              storeLogoUrl: store.storeLogoUrl,
              roleName: role.roleName,
              permissions: staff.permissions,
              joinedAt: staff.acceptedAt || staff.invitedAt,
            };
          } catch (error) {
            console.error(`Error enriching store ${staff.storeId}:`, error);
            return null;
          }
        })
      );

      return enrichedStores.filter((store) => store !== null) as any;
    } catch (error) {
      console.error("Error fetching user staff stores:", error);
      return [];
    }
  }
}

export class StaffInvitationsModel extends BaseModel<StaffInvitations> {
  private readonly INVITATION_EXPIRY_DAYS = 7;

  constructor() {
    super(STAFF_INVITATIONS_ID);
  }

  private generateInvitationToken(): string {
    return generateRandomToken();
  }

  private getExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.INVITATION_EXPIRY_DAYS);
    return expiryDate;
  }

  async isUserAlreadyStaff(storeId: string, email: string): Promise<boolean> {
    try {
      const { databases, users } = await createAdminClient();

      const userList = await users.list([Query.equal("email", email)]);

      if (userList.total === 0) {
        return false;
      }

      const userId = userList.users[0].$id;

      const staffRecords = await databases.listDocuments(
        DATABASE_ID,
        STORE_STAFF_ID,
        [
          Query.equal("storeId", storeId),
          Query.equal("userId", userId),
          Query.limit(1),
        ]
      );

      return staffRecords.total > 0;
    } catch (error) {
      console.error("Error checking existing staff:", error);
      return false;
    }
  }

  async hasPendingInvitation(storeId: string, email: string): Promise<boolean> {
    try {
      const { databases } = await createAdminClient();

      const invitations = await databases.listDocuments(
        DATABASE_ID,
        this.collectionId,
        [
          Query.equal("storeId", storeId),
          Query.equal("email", email.toLowerCase()),
          Query.equal("invitationStatus", "pending"),
          Query.limit(1),
        ]
      );

      return invitations.total > 0;
    } catch (error) {
      console.error("Error checking pending invitations:", error);
      return false;
    }
  }

  async createInvitation(data: CreateInvitationTypes) {
    try {
      const { databases } = await createSessionClient();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("Invalid email format");
      }

      // Check if already staff
      const alreadyStaff = await this.isUserAlreadyStaff(
        data.storeId,
        data.email
      );
      if (alreadyStaff) {
        throw new Error("This user is already a staff member of this store");
      }

      // Check for pending invitation
      const hasPending = await this.hasPendingInvitation(
        data.storeId,
        data.email
      );
      if (hasPending) {
        throw new Error("A pending invitation already exists for this email");
      }

      const invitationData = {
        ...data,
        email: data.email.toLowerCase(),
        invitationToken: this.generateInvitationToken(),
        expiresAt: this.getExpiryDate().toISOString(),
        invitationStatus: "pending",
        invitedAt: new Date().toISOString(),
      };

      const invitation = await databases.createDocument<StaffInvitations>(
        DATABASE_ID,
        this.collectionId,
        ID.unique(),
        invitationData
      );

      return invitation;
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw error;
    }
  }

  async getStoreInvitations(
    storeId: string,
    status?: "pending" | "accepted" | "expired" | "cancelled"
  ) {
    try {
      const { databases } = await createSessionClient();

      const queries = [
        Query.equal("storeId", storeId),
        Query.orderDesc("$createdAt"),
      ];

      if (status) {
        queries.push(Query.equal("invitationStatus", status));
      }

      const invitations = await databases.listDocuments<StaffInvitations>(
        DATABASE_ID,
        this.collectionId,
        queries
      );

      return invitations.documents;
    } catch (error) {
      console.error("Error fetching store invitations:", error);
      return [];
    }
  }

  async validateToken(token: string): Promise<{
    valid: boolean;
    invitation?: StaffInvitations;
    message?: string;
  }> {
    try {
      const { databases } = await createAdminClient();

      const invitations = await databases.listDocuments<StaffInvitations>(
        DATABASE_ID,
        this.collectionId,
        [Query.equal("invitationToken", token), Query.limit(1)]
      );

      if (invitations.total === 0) {
        return { valid: false, message: "Invalid invitation token" };
      }

      const invitation = invitations.documents[0];

      if (invitation.invitationStatus !== "pending") {
        return {
          valid: false,
          message: `Invitation is ${invitation.invitationStatus}`,
        };
      }

      const expiresAt = new Date(invitation.expiresAt);
      if (expiresAt < new Date()) {
        await this.update(invitation.$id!, { invitationStatus: "expired" });
        return { valid: false, message: "Invitation has expired" };
      }

      return { valid: true, invitation };
    } catch (error) {
      console.error("Error validating token:", error);
      return { valid: false, message: "Error validating invitation" };
    }
  }

  async acceptInvitation(token: string, userId: string) {
    try {
      const { databases, users } = await createAdminClient();

      const validation = await this.validateToken(token);

      if (!validation.valid || !validation.invitation) {
        throw new Error(validation.message || "Invalid invitation");
      }

      const invitation = validation.invitation;

      // Verify user email matches invitation
      const user = await users.get(userId);

      if (user.email.toLowerCase() !== invitation.email) {
        throw new Error("User email does not match invitation");
      }

      // Get role details
      const role = await databases.getDocument<StoreRoles>(
        DATABASE_ID,
        STORE_ROLES_ID,
        invitation.roleId
      );

      // Create staff record
      const staffModel = new StoreStaffModel();
      const staffRecord = await staffModel.createStaffMember({
        storeId: invitation.storeId,
        storeType: invitation.storeType as "physical" | "virtual",
        userId,
        roleId: invitation.roleId,
        permissions: role.permissions,
        StoreStaffStatus: "active",
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt as any,
        acceptedAt: new Date(),
      });

      // Update invitation status
      await this.update(invitation.$id, {
        invitationStatus: "accepted",
        acceptedAt: new Date().toISOString(),
      });

      return staffRecord;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const { databases } = await createSessionClient();

      const invitation = await databases.getDocument<StaffInvitations>(
        DATABASE_ID,
        this.collectionId,
        invitationId
      );

      if (invitation.invitationStatus !== "pending") {
        throw new Error("Can only cancel pending invitations");
      }

      await this.update(invitationId, {
        invitationStatus: "cancelled",
      });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      throw error;
    }
  }

  async resendInvitation(invitationId: string): Promise<StaffInvitations> {
    try {
      const { databases } = await createAdminClient();

      const invitation = await databases.getDocument<StaffInvitations>(
        DATABASE_ID,
        this.collectionId,
        invitationId
      );

      if (invitation.invitationStatus !== "pending") {
        throw new Error("Can only resend pending invitations");
      }

      const expiresAt = new Date(invitation.expiresAt);
      const updates: Partial<StaffInvitations> = {};

      // Extend expiry if expired
      if (expiresAt < new Date()) {
        updates.invitationToken = this.generateInvitationToken();
        updates.expiresAt = this.getExpiryDate().toISOString();
        updates.invitationStatus = "pending" as any;
      }

      if (Object.keys(updates).length > 0) {
        return await this.update(invitationId, updates);
      }

      return invitation;
    } catch (error) {
      console.error("Error resending invitation:", error);
      throw error;
    }
  }
}
