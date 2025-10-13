import z from "zod";

export const CreateCustomRoleSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  storeType: z.enum(["physical", "virtual"]),
  roleName: z.string().min(1, "Role name is required").max(15),
  description: z.string().min(1, "Description is required").max(50),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
  isCustom: z.boolean(),
  createdBy: z.string(),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
});

export const UpdateRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  storeId: z.string().min(1, "Store ID is required"),
  roleName: z.string().min(1).max(15).optional(),
  description: z.string().min(1).max(50).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const CreateStaffSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  storeId: z.string().min(1, "Store ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
  permissions: z.array(z.string()).optional().nullable(),
  storeType: z.enum(["physical", "virtual"]),
  StoreStaffStatus: z.enum(["active", "inactive", "suspended"]),
  invitedBy: z.string(),
  invitedAt: z.date(),
  acceptedAt: z.date().optional(),
  lastActive: z.date().optional(),
  notes: z.string().optional(),
});

export const UpdateStaffSchema = CreateStaffSchema.partial().extend({
  staffId: z.string().min(1, "ID is required"),
});

export const RemoveStaffSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  storeId: z.string().min(1, "Store ID is required"),
  reason: z.string().optional(),
});

export const CreateInvitationSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  storeType: z.enum(["physical", "virtual"]),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  invitedBy: z.string(),
});

export const InviteStaffSchema = z.object({
  storeId: z.string().min(1, "Store ID is required"),
  storeType: z.enum(["physical", "virtual"]),
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  customMessage: z.string().optional(),
});

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, "Invalid token"),
});

export const InvitationOperationSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
  storeId: z.string().min(1, "Store ID is required"),
});

export const DeleteRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  storeId: z.string().min(1, "Store ID is required"),
});

export type CreateStaffTypes = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffTypes = z.infer<typeof UpdateStaffSchema>;
export type CreateCustomRoleTypes = z.infer<typeof CreateCustomRoleSchema>;
export type UpdateRoleTypes = z.infer<typeof UpdateRoleSchema>;
export type CreateInvitationTypes = z.infer<typeof CreateInvitationSchema>;
