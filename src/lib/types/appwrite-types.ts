import { type Models } from "node-appwrite";

export enum AccountType {
  SYS_ADMIN = "sysAdmin",
  SYS_AGENT = "sysAgent",
  PHYSICAL_SELLER = "physicalSeller",
  VIRTUAL_STORE_OWNER = "virtualStoreOwner",
  BUYER = "buyer",
}

export enum ApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum Status {
  ACTIVE = "active",
  DRAFT = "draft",
  ARCHIVED = "archived",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  FLAGGED = "flagged",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export enum InputType {
  TEXT = "text",
  COLOR = "color",
  RANGE = "range",
  NUMBER = "number",
  SELECT = "select",
  MULTISELECT = "multiselect",
  BOOLEAN = "boolean",
}

export enum Type {
  SIMPLE = "simple",
  GROUPED = "grouped",
}

export enum StockStatus {
  IN_STOCK = "in_stock",
  LOW_STOCK = "low_stock",
  OUT_OF_STOCK = "out_of_stock",
}

export enum StoreType {
  PHYSICAL_STORE = "physicalStore",
  VIRTUAL_STORE = "virtualStore",
  PHYSICAL = "physical",
  VIRTUAL = "virtual",
}

export enum StoreStaffStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum ApplicableToStoreType {
  BOTH = "both",
  PHYSICAL = "physical",
  VIRTUAL = "virtual",
}

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  FAILED = "failed",
}

export enum CommissionStatus {
  PENDING = "pending",
}

export enum PhysicalStoreFulfillmentOrderStatus {
  PENDING_FULFILLMENT = "pending_fulfillment",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ReturnOrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum VirtualStoreReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum ReviewType {
  PRODUCT = "product",
  STORE = "store",
  REPLY = "reply",
}

export enum UserType {
  CUSTOMER = "customer",
  STORE_OWNER = "store_owner",
  ADMIN = "admin",
}

export enum VoteType {
  HELPFUL = "helpful",
  UNHELPFUL = "unhelpful",
}

export enum Reason {
  SPAM = "spam",
  INAPPROPRIATE = "inappropriate",
  FAKE = "fake",
  OFFENSIVE = "offensive",
  OTHER = "other",
}

export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
  BUY_X_GET_Y = "buy_x_get_y",
  BUNDLE = "bundle",
  BULK_PRICING = "bulk_pricing",
  FLASH_SALE = "flash_sale",
  FIRST_TIME_BUYER = "first_time_buyer",
}

export enum ValueType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

export enum ApplicableTo {
  PRODUCTS = "products",
  CATEGORIES = "categories",
  COLLECTIONS = "collections",
  STORE_WIDE = "store_wide",
  COMBINATIONS = "combinations",
}

export enum BadgeType {
  NEW = "new",
  SALE = "sale",
  LIMITED = "limited",
  BESTSELLER = "bestseller",
  FEATURED = "featured",
  EXCLUSIVE = "exclusive",
  TRENDING = "trending",
  LOW_STOCK = "low_stock",
  PRE_ORDER = "pre_order",
  CUSTOM = "custom",
}

export type UsersData = Models.Document & {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  accountType: AccountType;
  applicationStatus: ApplicationStatus | null;
  applicationReviewedAt: string | null;
  applicationReviewedBy: string | null;
  applicationReviewNotes: string | null;
  roleChangedAt: string | null;
  roleChangedBy: string | null;
  roleChangeReason: string | null;
  previousRole: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  applicationReason: string | null;
  bio: string | null;
  website: string | null;
};

export type VirtualStore = Models.Document & {
  storeName: string;
  desccription: string | null;
  storeBio: string | null;
  bannerUrls: string[] | null;
  bannerIds: string[] | null;
  storeType: StoreType | null;
  storeLogoId: string | null;
  storeLogoUrl: string | null;
  subDomain: string;
  locale: string | null;
  owner: string;
  virtualProductsIds: string[] | null;
  operatingCountry: string;
  countryCurrency: string;
  totalOrders: number | null;
  totalRevenue: number | null;
  commissionEarned: number | null;
  isActive: boolean;
  rating: number | null;
};

export type PhysicalStore = Models.Document & {
  storeName: string;
  description: string | null;
  bio: string | null;
  owner: string;
  latitude: number;
  longitude: number;
  address: string;
  country: string;
  storeLogoId: string | null;
  storeLogoUrl: string | null;
  createdFrom: string | null;
  currency: string;
};

export type ProductCategories = Models.Document & {
  categoryName: string;
  iconUrl: string | null;
  storeId: string | null;
  createdBy: string;
  slug: string;
  isActive: boolean | null;
  sortOrder: number | null;
  iconFileId: string | null;
  description: string | null;
};

export type Subcategories = Models.Document & {
  categoryId: string;
  createdBy: string;
  isActive: boolean;
  slug: string;
  subCategoryName: string;
  iconUrl: string | null;
  iconFileId: string | null;
  productTypes: string[] | null;
  description: string | null;
  sortOrder: number;
};

export type CatalogProductTypes = Models.Document & {
  productTypeName: string;
  subcategoryId: string;
  categoryId: string;
  description: string | null;
  slug: string | null;
  sortOrder: number;
  isActive: boolean;
  createdBy: string;
};

export type Products = Models.Document & {
  physicalStoreId: string;
  name: string;
  description: string;
  shortDescription: string | null;
  sku: string;
  basePrice: number;
  currency: string;
  status: Status;
  featured: boolean;
  categoryId: string;
  subcategoryId: string;
  productTypeId: string;
  tags: string[] | null;
  images: string[] | null;
  hasVariants: boolean;
  isDropshippingEnabled: boolean;
  createdBy: string;
  storeLatitude: number;
  storeLongitude: number;
  storeCountry: string;
  categoryName: string | null;
  categoryPath: string | null;
  subcategoryName: string | null;
  productTypeName: string | null;
  totalStock: number;
  stockStatus: StockStatus;
  viewCount: number;
  salesCount: number;
  rating: number;
  reviewCount: number;
  categoryIds: string[] | null;
  availableVariantTypes: string[] | null;
  availableVariantValues: string[] | null;
  availableColorCodes: string[] | null;
  searchText: string | null;
  searchKeywords: string[] | null;
  orderCount: number;
  saveCount: number;
  popularityScore: number;
};

export type PhysicalProducts = Models.Document & {
  storeId: string;
  name: string;
  description: string;
  shortDescription: string | null;
  sku: string;
  basePrice: number;
  status: Status;
  featured: boolean;
  categoryId: string;
  subcategoryId: string;
  productTypeId: string;
  tags: string[] | null;
  weight: number | null;
  dimensions: string | null;
  hasVariants: boolean;
  variantIds: string[] | null;
  combinationIds: string[] | null;
  images: string[] | null;
  storeLat: number;
  storeLong: number;
  storeOriginCountry: string;
  createdBy: string;
  currency: string;
};

// Variant Types
export type ProductVariants = Models.Document & {
  productId: string;
  templateId: string;
  name: string;
  inputType: InputType;
  values: string;
  required: boolean;
  sortOrder: number | null;
};

export type ProductCombinations = Models.Document & {
  productId: string;
  variantStrings: string[] | null;
  sku: string;
  stockQuantity: number | null;
  isActive: boolean;
  weight: number | null;
  dimensions: string | null;
  images: string[] | null;
  basePrice: number;
  colorVariantId: string | null;
  variantValues: string | null;
};

export type VariantOptions = Models.Document & {
  variantId: string;
  value: string | null;
  label: string | null;
  colorCode: string | null;
  additionalPrice: number | null;
  isDefault: boolean | null;
};

export type VariantCombinationValues = Models.Document & {
  combinationId: string;
  variantTemplateId: string | null;
  value: string | null;
};

export type CatalogVariantTemplates = Models.Document & {
  variantTemplateName: string;
  description: string | null;
  inputType: InputType;
  isRequired: boolean;
  categoryIds: string[] | null;
  subcategoryIds: string[] | null;
  productTypeIds: string[] | null;
  sortOrder: number;
  isActive: boolean;
  createdBy: string;
};

export type CatalogVariantOptions = Models.Document & {
  variantTemplateId: string;
  value: string;
  label: string;
  colorCode: string | null;
  additionalPrice: number;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type CatalogProductTypeVariants = Models.Document & {
  productTypeId: string;
  variantTemplateId: string;
  isRequired: boolean;
  sortOrder: number;
  createdBy: string;
};

export type ProductVariantsValues = Models.Document & {
  catalogVariantTemplateId: string;
  values: string;
  productId: string;
  variantName: string;
  inputType: InputType;
};

export type ProductColors = Models.Document & {
  productId: string;
  colorName: string;
  colorCode: string;
  additionalPrice: number | null;
  isDefault: boolean | null;
  images: string[] | null;
};

// Virtual Product Types
export type VirtualProducts = Models.Document & {
  originalProductId: string;
  createdBy: string;
  virtualStoreId: string;
  sellingPrice: number;
  purchasePrice: number;
  currency: string | null;
  generalImageUrls: string[] | null;
  mainProdCommission: number;
  combinationPricesIds: string[] | null;
};

export type AffiliateProductImports = Models.Document & {
  virtualStoreId: string;
  productId: string;
  isActive: boolean;
  importedAt: string;
  lastSyncedAt: string | null;
  commission: number;
  featured: boolean | null;
  virtualStoreName: string;
};

export type AffiliateCombinationPricing = Models.Document & {
  affiliateImportId: string;
  combinationId: string;
  customCommission: number | null;
  isActive: boolean;
};

export type VirtualCombinationPrices = Models.Document & {
  virtualProductId: string;
  combinationId: string;
  basePrice: number;
  commission: number;
  finalPrice: number;
};

// Collection Types
export type ProductCollections = Models.Document & {
  collectionName: string;
  createdBy: string;
  storeId: string | null;
  bannerImageUrl: string | null;
  description: string | null;
  type: Type;
  featured: boolean | null;
  bannerImageId: string | null;
  groups: string[] | null;
  productsIds: string[] | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroDescription: string | null;
  heroButtonText: string | null;
  heroImageUrl: string | null;
};

export type ProductCollectionGroups = Models.Document & {
  groupImageUrl: string | null;
  groupImageId: string | null;
  groupName: string | null;
  displayOrder: number | null;
  collectionId: string | null;
};

export type SavedItems = Models.Document & {
  userId: string;
  productId: string;
};

// Order Types
export type Orders = Models.Document & {
  orderNumber: string;
  customerId: string;
  customerEmail: string | null;
  virtualStoreId: string;
  totalCommission: number | null;
  deliveryAddress: string | null;
  notes: string | null;
  isExpressDelivery: boolean;
  paymentMethod: string;
  orderStatus: OrderStatus;
  orderDate: string;
  estimatedDeliveryDate: string | null;
  itemCount: number | null;
  deliveredAt: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  customerPhone: string;
  currency: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  statusHistory: string | null;
};

export type OrderItems = Models.Document & {
  orderId: string;
  virtualProductId: string;
  originalProductId: string;
  productName: string;
  productImage: string | null;
  sku: string;
  basePrice: number;
  sellingPrice: number;
  commission: number;
  quantity: number | null;
  subtotal: number;
  virtualStoreId: string;
  physicalStoreId: string;
};

export type CommissionRecord = Models.Document & {
  orderId: string;
  virtualStoreId: string;
  totalCommission: number;
  commissionStatus: CommissionStatus;
  physicalStoreId: string;
};

export type OrderFullfilmentRecords = Models.Document & {
  orderId: string;
  physicalStoreId: string;
  itemCount: number | null;
  totalValue: number | null;
  physicalStoreFulfillmentOrderStatus: PhysicalStoreFulfillmentOrderStatus;
  cancelledAt: string | null;
  virtualStoreId: string;
};

export type ReturnOrderRequests = Models.Document & {
  orderId: string;
  customerId: string;
  reason: string;
  description: string | null;
  returnOrderStatus: ReturnOrderStatus;
  requestedAt: string;
};

// Review Types
export type ProductReview = Models.Document & {
  productId: string;
  virtualStoreId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  pros: string[] | null;
  cons: string[] | null;
  isVerifiedPurchase: boolean | null;
  orderId: string | null;
  images: string[] | null;
  videos: string[] | null;
  status: Status;
  moderatedBy: string | null;
  moderatedAt: string | null;
  moderationNotes: string | null;
  replies: number | null;
  lastReplyAt: string | null;
  viewCount: number | null;
  shareCount: number | null;
  userName: string;
  helpfulVotes: number | null;
  unhelpfulVotes: number | null;
  orderAmount: number | null;
  orderCurrency: string | null;
  purchaseDate: string | null;
};

export type VirtualstoreReviews = Models.Document & {
  virtualStoreId: string;
  overallRating: number;
  title: string | null;
  comment: string | null;
  customerServiceRating: number | null;
  isVerifiedCustomer: boolean;
  orderCount: number | null;
  virtualStoreReviewStatus: VirtualStoreReviewStatus | null;
  moderatedBy: string | null;
  moderatedAt: string | null;
  userId: string;
  userName: string;
};

export type ReviewReply = Models.Document & {
  reviewId: string;
  reviewType: ReviewType;
  replyingUserId: string;
  userName: string;
  userType: UserType;
  comment: string | null;
  helpfulVotes: number | null;
  unhelpfulVotes: number | null;
  status: Status;
  moderatedBy: string | null;
  moderatedAt: string | null;
};

export type ReviewVote = Models.Document & {
  reviewId: string;
  reviewType: ReviewType;
  userId: string;
  voteType: VoteType;
};

export type ReviewReport = Models.Document & {
  reviewId: string;
  reviewType: ReviewType;
  reportedBy: string;
  reason: Reason;
  description: string | null;
  status: Status;
  resolvedBy: string | null;
  resolvedAt: string | null;
};

// Staff & Permission Types
export type StoreStaff = Models.Document & {
  storeId: string;
  storeType: StoreType;
  userId: string;
  roleId: string;
  permissions: string[] | null;
  StoreStaffStatus: StoreStaffStatus;
  invitedBy: string;
  invitedAt: string;
  acceptedAt: string | null;
  lastActive: string | null;
  notes: string | null;
};

export type StoreRoles = Models.Document & {
  storeId: string | null;
  storeType: StoreType;
  roleName: string;
  description: string;
  permissions: string[] | null;
  isCustom: boolean;
  createdBy: string;
  isActive: boolean;
  priority: number | null;
};

export type StorePermissions = Models.Document & {
  permissionKey: string;
  permissionName: string;
  module: string;
  description: string;
  applicableToStoreType: ApplicableToStoreType;
  storeId: string | null;
};

export type StaffInvitations = Models.Document & {
  storeId: string;
  roleId: string;
  invitedBy: string;
  email: string;
  invitationToken: string;
  storeType: StoreType;
  expiresAt: string;
  invitedAt: string;
  invitationStatus: InvitationStatus;
};

export type StoreSubscribers = Models.Document & {
  storeId: string;
  userId: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  preferences: string | null;
};

// Discount Types
export type Discounts = Models.Document & {
  storeId: string;
  storeType: StoreType;
  name: string;
  description: string | null;
  discountType: DiscountType;
  valueType: ValueType;
  value: number;
  applicableTo: ApplicableTo;
  targetIds: string[] | null;
  minPurchaseAmount: number | null;
  minQuantity: number | null;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
  currentUsageCount: number | null;
  priority: number;
  canCombineWithOthers: boolean;
  excludedCustomerIds: string[] | null;
  eligibleCustomerIds: string[] | null;
  shippingCountries: string[] | null;
  buyXQuantity: number | null;
  getYQuantity: number | null;
  createdBy: string;
};

export type CouponCodes = Models.Document & {
  code: string;
  discountId: string;
  storeId: string;
  isActive: boolean;
  usageCount: number | null;
};

export type CouponUsage = Models.Document & {
  couponCodeId: string;
  customerId: string;
  orderId: string;
  discountAmount: number | null;
  usedAt: string;
};

export type ProductBadges = Models.Document & {
  productId: string;
  badgeType: BadgeType;
  label: string | null;
  colorScheme: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  priority: number | null;
};

export type ReturnPolicies = Models.Document & {
  storeId: string;
  productId: string;
  categoryId: string | null;
  isDefault: boolean;
  returnWindowDays: number;
  allowReturns: boolean;
  allowExchanges: boolean;
  restockingFeePercent: number | null;
  conditions: string | null;
  requiresOriginalPackaging: boolean;
  requiresReceipt: boolean;
  shippingCostResponsibility: string | null;
};
