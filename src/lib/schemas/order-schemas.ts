import z from "zod";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "../constants";

export const AddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phoneNumber: z.string().min(10, "Valid phone number required").max(20),
  street: z
    .string()
    .min(5, "Street address must be at least 5 characters")
    .max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State/Province is required").max(100),
  zip: z.string().min(3, "ZIP/Postal code is required").max(20),
  country: z.string().min(2, "Country code required").max(3),
  additionalInfo: z.string().max(500).optional(),
});

export const OrderItemSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  virtualProductId: z.string().min(1, "Virtual product ID is required"),
  originalProductId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required").max(200),
  productImage: z.string().url().optional(),
  sku: z.string().min(1, "Product SKU is required").max(100),
  basePrice: z.number().min(0, "Base price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  commission: z.number().min(0, "Commission must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(999),
  subtotal: z.number().min(0, "Subtotal must be positive"),
  virtualStoreId: z.string().min(1, "Virtual store ID is required"),
  physicalStoreId: z.string().min(1, "Physical store ID is required"),
});

// Main Order Creation Schema
export const CreateOrderSchema = z
  .object({
    customerId: z.string().min(1, "Customer ID is required"),
    customerEmail: z.string().email("Valid email required").optional(),
    customerPhone: z.string().min(10, "Valid phone number required").optional(),
    virtualStoreId: z.string().min(1, "Virtual store ID is required"),

    // Financial details (single currency)
    currency: z.string().length(3, "Currency must be 3 characters"),
    subtotal: z.number().min(0, "Subtotal must be positive"),
    totalAmount: z.number().min(0, "Total amount must be positive"),
    shippingCost: z.number().min(0).default(0),
    taxAmount: z.number().min(0).default(0),
    discountAmount: z.number().min(0).default(0),

    // Address information
    shippingAddress: AddressSchema,
    billingAddress: AddressSchema.optional(),

    // Payment and delivery
    paymentMethod: z.enum([
      "cash_on_delivery",
      "bank_transfer",
      "mobile_money",
    ]),
    paymentStatus: z
      .enum(["pending", "confirmed", "failed"])
      .default("pending"),
    deliveryType: z
      .enum(["standard", "express", "overnight"])
      .default("standard"),
    deliveryInstructions: z.string().max(500).optional(),
    preferredDeliveryTime: z.string().optional(),

    // Order metadata
    orderDate: z
      .string()
      .datetime()
      .default(() => new Date().toISOString()),
    estimatedDeliveryDate: z.string().datetime().optional(),
    notes: z.string().max(1000).optional(),
    orderSource: z.enum(["web", "mobile", "api"]).default("web"),

    // Order items
    orderItems: z
      .array(OrderItemSchema)
      .min(1, "At least one item is required"),
  })
  .refine(
    (data) => {
      // Validate that calculated totals match
      const calculatedSubtotal = data.orderItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      const tolerance = 0.01;
      return Math.abs(calculatedSubtotal - data.subtotal) <= tolerance;
    },
    {
      message: "Order subtotal doesn't match sum of item subtotals",
      path: ["subtotal"],
    }
  )
  .refine(
    (data) => {
      // Validate total calculation
      const calculatedTotal =
        data.subtotal +
        data.shippingCost +
        data.taxAmount -
        data.discountAmount;
      const tolerance = 0.01;
      return Math.abs(calculatedTotal - data.totalAmount) <= tolerance;
    },
    {
      message: "Total amount calculation is incorrect",
      path: ["totalAmount"],
    }
  )
  .refine(
    (data) => {
      // Validate all items belong to the same virtual store
      const virtualStoreIds = new Set(
        data.orderItems.map((item) => item.virtualStoreId)
      );
      return (
        virtualStoreIds.size === 1 && virtualStoreIds.has(data.virtualStoreId)
      );
    },
    {
      message: "All items must belong to the specified virtual store",
      path: ["orderItems"],
    }
  );

// Update Order Status Schema
export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.nativeEnum(OrderStatus),
  notes: z.string().max(1000).optional(),
  notifyCustomer: z.boolean().default(true),
});

// Update Fulfillment Status Schema
export const UpdateFulfillmentStatusSchema = z.object({
  fulfillmentRecordId: z.string().min(1, "Fulfillment record ID is required"),
  status: z.nativeEnum(PhysicalStoreFulfillmentOrderStatus),
  notes: z.string().max(1000).optional(),
  trackingNumber: z.string().max(100).optional(),
  estimatedDeliveryDate: z.string().datetime().optional(),
});

// Get Orders Filters Schema
export const GetOrdersSchema = z.object({
  // Store filtering
  storeId: z.string().optional(),
  storeType: z.enum(["virtual", "physical"]).optional(),

  // Status filtering
  orderStatus: z.array(z.nativeEnum(OrderStatus)).optional(),
  fulfillmentStatus: z
    .array(z.nativeEnum(PhysicalStoreFulfillmentOrderStatus))
    .optional(),
  commissionStatus: z.array(z.string()).optional(),

  // Customer filtering
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),

  // Location filtering
  orderCountry: z.string().optional(),
  currency: z.string().length(3).optional(),

  // Date filtering
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),

  // Value filtering
  valueRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .optional(),

  // Pagination
  pagination: z
    .object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(25),
    })
    .default({ page: 1, limit: 25 }),

  // Sorting
  sorting: z
    .object({
      field: z
        .enum(["$createdAt", "totalAmount", "orderStatus", "orderDate"])
        .default("$createdAt"),
      direction: z.enum(["asc", "desc"]).default("desc"),
    })
    .default({ field: "$createdAt", direction: "desc" }),
});

// Get Order Analytics Schema
export const GetOrderAnalyticsSchema = z.object({
  storeId: z.string().optional(),
  storeType: z.enum(["virtual", "physical"]).optional(),
  country: z.string().optional(),
  currency: z.string().length(3).optional(),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
  includeDetailedBreakdown: z.boolean().default(false),
});

// Get Order by ID Schema
export const GetOrderByIdSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  includeRelations: z.boolean().default(true),
});

// Cancel Order Schema
export const CancelOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  reason: z.string().min(1, "Cancellation reason is required").max(500),
  refundAmount: z.number().min(0).optional(),
  notifyCustomer: z.boolean().default(true),
});

// Process Order Items Schema (for validation before order creation)
export const ProcessOrderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        affiliateImportId: z.string().min(1),
        productName: z.string().min(1),
        quantity: z.number().int().min(1).max(999),
        expectedPrice: z.number().min(0),
      })
    )
    .min(1, "At least one item is required"),
  virtualStoreId: z.string().min(1, "Virtual store ID is required"),
});

// Bulk Update Orders Schema
export const BulkUpdateOrdersSchema = z.object({
  orderIds: z
    .array(z.string().min(1))
    .min(1, "At least one order ID required")
    .max(50, "Maximum 50 orders at once"),
  updates: z
    .object({
      status: z.nativeEnum(OrderStatus).optional(),
      fulfillmentStatus: z
        .nativeEnum(PhysicalStoreFulfillmentOrderStatus)
        .optional(),
      notes: z.string().max(1000).optional(),
      estimatedDeliveryDate: z.string().datetime().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one update field is required"
    ),
  notifyCustomers: z.boolean().default(false),
});

// Order Stats Schema
export const GetOrderStatsSchema = z.object({
  storeId: z.string().optional(),
  storeType: z.enum(["virtual", "physical"]).optional(),
  filters: z
    .object({
      orderStatus: z.array(z.nativeEnum(OrderStatus)).optional(),
      fulfillmentStatus: z
        .array(z.nativeEnum(PhysicalStoreFulfillmentOrderStatus))
        .optional(),
      commissionStatus: z.array(z.string()).optional(),
      orderCountry: z.string().optional(),
      currency: z.string().optional(),
      dateRange: z
        .object({
          from: z.date(),
          to: z.date(),
        })
        .optional(),
    })
    .default({}),
});

// Customer Orders Schema
export const GetCustomerOrdersSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  pagination: z
    .object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(10),
    })
    .default({ page: 1, limit: 10 }),
  filters: z
    .object({
      status: z.array(z.nativeEnum(OrderStatus)).optional(),
      dateRange: z
        .object({
          from: z.date(),
          to: z.date(),
        })
        .optional(),
    })
    .default({}),
});

// Overdue Orders Schema
export const GetOverdueOrdersSchema = z.object({
  storeId: z.string().optional(),
  storeType: z.enum(["virtual", "physical"]).optional(),
  daysOverdue: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
});

// Type exports for use in actions
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderItemCreateData = z.infer<typeof OrderItemSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateFulfillmentStatusInput = z.infer<
  typeof UpdateFulfillmentStatusSchema
>;
export type GetOrdersInput = z.infer<typeof GetOrdersSchema>;
export type GetOrderAnalyticsInput = z.infer<typeof GetOrderAnalyticsSchema>;
export type GetOrderByIdInput = z.infer<typeof GetOrderByIdSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
export type ProcessOrderItemsInput = z.infer<typeof ProcessOrderItemsSchema>;
export type BulkUpdateOrdersInput = z.infer<typeof BulkUpdateOrdersSchema>;
export type GetOrderStatsInput = z.infer<typeof GetOrderStatsSchema>;
export type GetCustomerOrdersInput = z.infer<typeof GetCustomerOrdersSchema>;
export type GetOverdueOrdersInput = z.infer<typeof GetOverdueOrdersSchema>;
