import { Models } from "node-appwrite";
import { UserRole } from "./constants";
import { ProductCombination } from "./schemas/product-variants-schema";
import {
  AffiliateProductImports,
  Discounts,
  ProductCollectionGroups,
  ProductCollections,
  ProductColors,
  Products,
  SavedItems,
  Status,
  UsersData,
  VirtualProducts,
  VirtualStore,
} from "./types/appwrite/appwrite";
import z from "zod";
import {
  createPhysicalStoreFormSchema,
  createVirtualStoreFormSchema,
  updateVirtualStoreFormSchema,
} from "./schemas/stores-schema";
import { PhysicalStore } from "@/lib/types/appwrite/appwrite";
import { VirtualProductSchema } from "./schemas/products-schems";
import { PriceBreakdown } from "./helpers/discount-calculator";

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  username: string;
  phoneNumber: string;
  email: string;
  password: string;
};

// type SocialLinks = {
//     instagram?: string;
//     twitter?: string;
//     facebook?: string;
//     linkedin?: string;
// };

export type CurrentUserType = Models.User<Models.Preferences> | null;

export type ImageDimensionConstraints = {
  width?: number;
  height?: number;
  ratio?: number;
  tolerance?: number;
};

export type UserRoleType =
  | UserRole.SYS_ADMIN
  | UserRole.SYS_AGENT
  | UserRole.PHYSICAL_STORE_OWNER
  | UserRole.VIRTUAL_STORE_OWNER
  | UserRole.PHYSICAL_SELLER_PENDING
  | UserRole.BUYER;

export type AppwriteDocumentResponse = {
  total: number;
  documents: Models.Document;
};

export type AdminDashboardType =
  | "systemAdmin"
  | "virtualStoreAdmin"
  | "physicalStoreAdmin"
  | undefined;

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image: string;
    productCurrency: string;
    sku?: string;
    virtualProductId?: string;
    virtualStoreId?: string;
    physicalStoreId?: string;
    commission?: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Models.User<Models.Preferences> | null;
  roles: string[];
  teams: Models.Team<Models.Preferences>[];
  memberships: Models.Membership[];
  isSystemAdmin: boolean;
  isSystemAgent: boolean;
  isVirtualStoreOwner: boolean;
  isPhysicalStoreOwner: boolean;
  isStoreOwner: boolean;
  isStoreAdmin: boolean;
  isStoreStaff: boolean;
  ownedStores: string[];
  adminStores: string[];
  staffStores: string[];
  hasSystemAccess: () => boolean;
  canAccessStore: (storeId: string) => boolean;
  getStoreRole: (storeId: string) => "owner" | "admin" | "staff" | null;
  hasStorePermission: (
    storeId: string,
    permission: "read" | "write" | "delete"
  ) => boolean;
  canAccessResource: (
    resource: string,
    permission: "read" | "write" | "delete"
  ) => boolean;
}
export type OriginalProductTypes = Products;
export interface OriginalProductWithVirtualProducts
  extends OriginalProductTypes {
  combinations?: ProductCombinationTypes[];
  virtualProducts: VirtualProductTypes[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface ProductCombinationTypes extends Models.Document {
  productId: string;
  variantStrings?: string[];
  sku: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  weight?: number;
  dimensions?: string;
  images?: string[];
}
export interface VirtualProductTypes extends AffiliateProductImports {
  name: string;
  description: string;
  sku: string;
  price: number;
  basePrice: number;
  currency: string;
  status: Status;
  hasVariants: boolean;
  categoryId: string;
  subcategoryId: string;
  productTypeId: string;
  tags: string[] | null;
  images: string[] | null;
  colors: ProductColors[] | null;
  physicalStoreLatitude: number;
  physicalStoreLongitude: number;
  physicalStoreCountry: string;
  shortDescription?: string;
  physicalStoreId: string;
  virtualStore: VirtualStoreTypes
  discount?: Discounts | null;
  priceBreakdown: PriceBreakdown;
  finalPrice: number;
  originalPrice: number;
  savings: number;
  hasDiscount: boolean;
  categoryName: string;
  subcategoryName: string;
}

export type VirtualStoreTypes = VirtualStore;

enum OrderStatus {
  pending = "pending",
  shipped = "shipped",
  delivered = "delivered",
  cancelled = "cancelled",
}

export interface OrderItem {
  quantity: number;
  price: number;
  order: OrderTypes;
  productId: string;
}
export interface OrderTypes extends Models.Document {
  customerId: string;
  orderDate: Date;
  status: OrderStatus;
  totalAmount: number;
  notes: string;
  orderItems: OrderItem[];
  deliveryAddressId: string;
}

export interface FilterState {
  storeId?: string;
  productType?: string;
  category?: string;
  page: number;
  limit: number;
  sortBy?: string;
  variants?: { templateId: string; values: string[] }[];
  priceRange?: { min?: number; max?: number };
  search?: string;
}

export enum SortBy {
  newestFirst = "newest",
  priceLowToHigh = "price_asc",
  priceHighToLow = "price_desc",
}

export type VirtualProductsSearchParams = {
  category?: string;
  subcategory?: string;
  sortBy?: SortBy | undefined | string;
  lastId?: string;
  firstId?: string;
  minPrice?: string;
  maxPrice?: string;
  query?: string;
};

export type CollectionTypes = ProductCollections;
export type CollectionGroupsTypes = ProductCollectionGroups;
export type SavedItemType = SavedItems;
export type UserDataTypes = UsersData;

export interface ProductFilters {
  page?: number;
  limit?: number;
  storeId?: string;
  categoryId?: string;
  subcategoryId?: string;
  productTypeId?: string;
  status?: "active" | "inactive" | "draft" | "all";
  featured?: boolean;
  search?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
  combinations?: ProductCombination[];
  view: string
}

export type CreateVirtualStoreTypes = z.infer<
  typeof createVirtualStoreFormSchema
>;
export type UpdateVirtualStoreTypes = z.infer<
  typeof updateVirtualStoreFormSchema
>;
export type CreatePhysicalStoreTypes = z.infer<
  typeof createPhysicalStoreFormSchema
>;
export type PhysicalStoreTypes = PhysicalStore;
export type CreateVirtualProductTypes = z.infer<typeof VirtualProductSchema>;
