"use server";

import z from "zod";
import { AffiliateProductModel } from "../models/AffliateProductModel";
import { ProductModel } from "../models/ProductModel";
import { OrderFormSchema, OrderSchema } from "../schemas/products-schems";
import { getAuthState } from "../user-permission";
import { ID, Query } from "node-appwrite";
import { OrderStatus, PhysicalStoreFulfillmentOrderStatus } from "../constants";
import { createAdminClient, createDocumentPermissions, createSessionClient } from "../appwrite";
import { COMMISSION_RECORDS_COLLECTION_ID, DATABASE_ID, ORDER_FULFILLMENT_RECORDS_COLLECTION_ID, ORDER_ITEMS_COLLECTION_ID, ORDERS_COLLECTION_ID } from "../env-config";
import { convertCurrency } from "@/hooks/use-currency";

type OrderFormData = z.infer<typeof OrderFormSchema>;
type OrderData = z.infer<typeof OrderSchema>;

interface OrderItemDetails {
    id: string;
    virtualProductId: string;
    originalProductId: string;
    name: string;
    sellingPrice: number; // Price customer pays (base price + commission)
    basePrice: number; // Original physical store price
    quantity: number;
    image: string;
    commission: number;
    virtualStoreId: string;
    physicalStoreId: string;
    sku: string;
    productCurrency: string; // Original product currency
    customerPrice: number; // Price customer saw in their currency
    customerCurrency: string; // Currency customer is paying in
    exchangeRate: number; // Rate used for conversion
}

interface ProcessedOrder {
    orderId: string;
    orderNumber: string;
    totalAmount: number; // In customer currency
    baseTotalAmount: number; // In base currency (USD)
    customerCurrency: string;
    baseCurrency: string;
    exchangeRateToBase: number;
    orderItems: OrderItemDetails[];
    virtualStoreId: string;
    estimatedDeliveryDate: Date;
    commissionSummary: {
        totalCommission: number; // In base currency
        totalBasePrice: number; // In base currency
        itemCount: number;
    };
    physicalStoreBreakdown: Array<{
        physicalStoreId: string;
        itemCount: number;
        baseValue: number; // In base currency
        commission: number; // In base currency
        customerValue: number; // In customer currency
    }>;
}

const productModel = new ProductModel();
const affiliateProductModel = new AffiliateProductModel();

export async function createOrder(orderData: OrderData): Promise<{ success?: string; error?: string; data?: ProcessedOrder }> {
    const { databases } = await createAdminClient();

    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const validatedData = OrderSchema.parse(orderData);
        const customerCurrency = validatedData.customerCurrency || "USD";
        const baseCurrency = "USD";

        const ratesTime = new Date(validatedData.exchangeRatesTimestamp);
        const now = new Date();
        const ageMinutes = (now.getTime() - ratesTime.getTime()) / (1000 * 60);

        if (ageMinutes > 30) {
            return { error: "Exchange rates are too old. Please refresh and try again." };
        }

        const processedItems = await processOrderItems(
            validatedData.selectedItems,
            customerCurrency,
            validatedData.exchangeRatesSnapshot
        );

        if (!processedItems.success || !processedItems.items) {
            return { error: processedItems.error || "something went wrong!" };
        }

        const virtualStoreIds = [...new Set(processedItems.items.map(item => item.virtualStoreId))];
        if (virtualStoreIds.length > 1) {
            return { error: "All items must be from the same store" };
        }

        const virtualStoreId = virtualStoreIds[0];

        const orderCalculations = calculateOrderTotals(
            processedItems.items,
            customerCurrency,
            baseCurrency,
            validatedData.exchangeRatesSnapshot
        );

        // Validate total matches what customer expects
        if (Math.abs(orderCalculations.customerTotalAmount - validatedData.totalAmount) > 0.01) {
            return { error: "Order total mismatch. Please refresh and try again." };
        }

        const orderId = ID.unique();
        const orderNumber = generateOrderNumber();

        const orderDocument = {
            orderNumber,
            customerId: user.$id,
            customerEmail: user.email,
            virtualStoreId,

            // Customer currency amounts
            customerCurrency,
            customerSubtotal: orderCalculations.customerSubtotal,
            customerTotalAmount: orderCalculations.customerTotalAmount,

            // Base currency amounts (for business logic)
            baseCurrency,
            baseSubtotal: orderCalculations.baseSubtotal,
            baseTotalAmount: orderCalculations.baseTotalAmount,

            // Exchange rate information
            exchangeRateToBase: orderCalculations.exchangeRateToBase,
            exchangeRatesTimestamp: validatedData.exchangeRatesTimestamp,

            // Business amounts (in base currency)
            totalCommission: orderCalculations.totalCommission,
            totalBasePrice: orderCalculations.totalBasePrice,

            // Order details
            deliveryAddress: JSON.stringify(validatedData.deliveryAddress),
            notes: validatedData.notes || "",
            isExpressDelivery: validatedData.isExpressDelivery,
            paymentMethod: JSON.stringify(validatedData.preferredPaymentMethod),

            status: OrderStatus.PENDING,
            orderDate: validatedData.orderDate,
            estimatedDeliveryDate: calculateEstimatedDelivery(validatedData.orderDate, validatedData.isExpressDelivery),
            itemCount: processedItems.items.length,
            exchangeRatesSnapshot: JSON.stringify({
                orderId,
                currency: validatedData.exchangeRatesSnapshot,
                rate: validatedData.exchangeRatesSnapshot,
                timestamp: validatedData.exchangeRatesTimestamp
            })
        };

        const permissions = createDocumentPermissions({ userId: user.$id });
        const newOrder = await databases.createDocument(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            orderId,
            orderDocument,
            permissions
        );

        // Create order items with currency information
        await createOrderItems(orderId, processedItems.items, user.$id);

        // Create commission record (in base currency)
        await createCommissionRecord(orderId, virtualStoreId, orderCalculations.totalCommission);

        // Create fulfillment records with both currencies
        await createPhysicalStoreFulfillmentRecords(orderId, orderCalculations.physicalStoreBreakdown);

        const response: ProcessedOrder = {
            orderId: newOrder.$id,
            orderNumber,
            totalAmount: orderCalculations.customerTotalAmount,
            baseTotalAmount: orderCalculations.baseTotalAmount,
            customerCurrency,
            baseCurrency,
            exchangeRateToBase: orderCalculations.exchangeRateToBase,
            orderItems: processedItems.items,
            virtualStoreId,
            estimatedDeliveryDate: new Date(orderDocument.estimatedDeliveryDate),
            commissionSummary: {
                totalCommission: orderCalculations.totalCommission,
                totalBasePrice: orderCalculations.totalBasePrice,
                itemCount: processedItems.items.length
            },
            physicalStoreBreakdown: orderCalculations.physicalStoreBreakdown
        };

        return {
            success: "Order placed successfully!",
            data: response
        };
    } catch (error) {
        console.error("createOrder error:", error);

        if (error instanceof z.ZodError) {
            return { error: "Invalid order data: " + error.errors.map(e => e.message).join(", ") };
        }

        if (error instanceof Error) {
            return { error: error.message };
        }

        return { error: "Failed to place order. Please try again." };

    }
}

async function processOrderItems(
    items: Array<{
        id: string;
        productId: string;
        name: string;
        price: number;
        quantity: number;
        image: string;
        productCurrency?: string;
    }>,
    customerCurrency: string,
    exchangeRates: Record<string, number>
): Promise<{ success: boolean; error?: string; items?: OrderItemDetails[] }> {
    try {
        const processedItems: OrderItemDetails[] = [];

        for (const item of items) {
            const virtualProduct = await affiliateProductModel.findVirtualProductById(item.productId);

            if (!virtualProduct) {
                return { success: false, error: `Product "${item.name}" not found or not available for purchase` };
            }

            if (!virtualProduct.isActive) {
                return { success: false, error: `Product "${item.name}" is no longer available` };
            }

            const originalProduct = await productModel.findById(virtualProduct.productId, {});
            if (!originalProduct || !originalProduct.isDropshippingEnabled || originalProduct.status !== "active") {
                return { success: false, error: `Product "${item.name}" is no longer available for dropshipping` };
            }

            const basePrice = originalProduct.basePrice;
            const commission = virtualProduct.commission;
            const sellingPrice = basePrice + commission;
            const productCurrency = originalProduct.currency || 'USD';

            const customerPriceCalculated = convertCurrency(
                sellingPrice,
                productCurrency,
                customerCurrency,
                exchangeRates
            );

            if (Math.abs(customerPriceCalculated - item.price) > 0.01) {
                return { success: false, error: `Price for "${item.name}" has changed. Please refresh and try again.` };
            }

            const exchangeRate = customerCurrency === productCurrency ? 1 :
                (exchangeRates[customerCurrency] || 1) / (exchangeRates[productCurrency] || 1);

            processedItems.push({
                id: item.id,
                virtualProductId: virtualProduct.$id,
                originalProductId: originalProduct.$id,
                name: item.name,
                sellingPrice, // In original currency
                basePrice,
                quantity: item.quantity,
                image: item.image,
                commission,
                virtualStoreId: virtualProduct.virtualStoreId,
                physicalStoreId: originalProduct.physicalStoreId,
                sku: originalProduct.sku,
                productCurrency,
                customerPrice: item.price, // What customer saw/pays
                customerCurrency,
                exchangeRate
            });
        }

        return { success: true, items: processedItems };
    } catch (error) {
        console.error("processOrderItems error:", error);
        return { success: false, error: "Failed to process order items" };
    }
}

function calculateOrderTotals(
    items: OrderItemDetails[],
    customerCurrency: string,
    baseCurrency: string,
    exchangeRates: Record<string, number>
) {
    const customerSubtotal = items.reduce((sum, item) => sum + (item.customerPrice * item.quantity), 0);
    const customerTotalAmount = customerSubtotal;

    const baseSubtotal = items.reduce((sum, item) => {
        const itemTotal = item.sellingPrice * item.quantity;
        const convertedAmount = convertCurrency(itemTotal, item.productCurrency, baseCurrency, exchangeRates);
        return sum + convertedAmount;
    }, 0);

    const baseTotalAmount = baseSubtotal;

    const totalCommission = items.reduce((sum, item) => {
        const commissionAmount = item.commission * item.quantity;
        return sum + convertCurrency(commissionAmount, item.productCurrency, baseCurrency, exchangeRates);
    }, 0);

    const totalBasePrice = items.reduce((sum, item) => {
        const basePriceAmount = item.basePrice * item.quantity;
        return sum + convertCurrency(basePriceAmount, item.productCurrency, baseCurrency, exchangeRates);
    }, 0);

    const physicalStoreGroups = items.reduce((groups, item) => {
        const storeId = item.physicalStoreId;
        if (!groups[storeId]) {
            groups[storeId] = {
                itemCount: 0,
                baseValue: 0,
                commission: 0,
                customerValue: 0
            };
        }
        groups[storeId].itemCount += item.quantity;

        // Convert to base currency for business logic
        const itemBaseValue = convertCurrency(item.basePrice * item.quantity, item.productCurrency, baseCurrency, exchangeRates);
        const itemCommission = convertCurrency(item.commission * item.quantity, item.productCurrency, baseCurrency, exchangeRates);

        groups[storeId].baseValue += itemBaseValue;
        groups[storeId].commission += itemCommission;
        groups[storeId].customerValue += item.customerPrice * item.quantity; // In customer currency

        return groups;
    }, {} as Record<string, { itemCount: number; baseValue: number; commission: number; customerValue: number }>);

    const physicalStoreBreakdown = Object.entries(physicalStoreGroups).map(([physicalStoreId, data]) => ({
        physicalStoreId,
        itemCount: data.itemCount,
        baseValue: data.baseValue,
        commission: data.commission,
        customerValue: data.customerValue
    }));

    const exchangeRateToBase = convertCurrency(1, customerCurrency, baseCurrency, exchangeRates);

    return {
        customerSubtotal,
        customerTotalAmount,
        baseSubtotal,
        baseTotalAmount,
        totalCommission,
        totalBasePrice,
        physicalStoreBreakdown,
        exchangeRateToBase
    };
};

function generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-6)}${random}`;
}

function calculateEstimatedDelivery(orderDate: Date, isExpress: boolean): string {
    const delivery = new Date(orderDate);

    const daysToAdd = isExpress ? 3 : 7;
    delivery.setDate(delivery.getDate() + daysToAdd);
    return delivery.toISOString();
}

async function createOrderItems(
    orderId: string,
    items: OrderItemDetails[],
    userId: string
): Promise<void> {
    const { databases } = await createAdminClient();
    const permissions = createDocumentPermissions({ userId });

    const itemPromises = items.map(async (item) => {
        const itemId = ID.unique();
        return databases.createDocument(
            DATABASE_ID,
            ORDER_ITEMS_COLLECTION_ID,
            itemId,
            {
                orderId,
                virtualProductId: item.virtualProductId,
                originalProductId: item.originalProductId,
                productName: item.name,
                productImage: item.image,
                sku: item.sku,
                basePrice: item.basePrice, // What physical store gets
                sellingPrice: item.sellingPrice, // What customer pays
                commission: item.commission, // What virtual store earns
                quantity: item.quantity,
                subtotal: item.sellingPrice * item.quantity,
                virtualStoreId: item.virtualStoreId,
                physicalStoreId: item.physicalStoreId,
            },
            permissions
        );
    });

    await Promise.all(itemPromises);
}

async function createCommissionRecord(
    orderId: string,
    virtualStoreId: string,
    totalCommission: number
): Promise<void> {
    const { databases } = await createAdminClient();

    const commissionId = ID.unique();
    await databases.createDocument(
        DATABASE_ID,
        COMMISSION_RECORDS_COLLECTION_ID,
        commissionId,
        {
            orderId,
            virtualStoreId,
            totalCommission,
            status: 'pending',
        }
    )
}

async function createPhysicalStoreFulfillmentRecords(
    orderId: string,
    physicalStoreBreakdown: Array<{
        physicalStoreId: string;
        itemCount: number;
        baseValue: number;
        commission: number;
    }>
): Promise<void> {
    const { databases } = await createAdminClient();

    const fulfillmentPromises = physicalStoreBreakdown.map(async (breakdown) => {
        const fulfillmentId = ID.unique();
        return databases.createDocument(
            DATABASE_ID,
            ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
            fulfillmentId,
            {
                orderId,
                physicalStoreId: breakdown.physicalStoreId,
                itemCount: breakdown.itemCount,
                totalValue: breakdown.baseValue,
                status: PhysicalStoreFulfillmentOrderStatus.PENDING,
            }
        )
    });

    await Promise.all(fulfillmentPromises);
}

export async function cancelOrder(orderId: string) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const { databases } = await createSessionClient();
        const order = await databases.getDocument(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            orderId
        );

        if (order.customerId !== user.$id) {
            return { error: "Access denied" };
        }

        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
            return { error: "Order cannot be cancelled at this stage" };
        }

        const updatedOrder = await databases.updateDocument(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            orderId,
            {
                status: OrderStatus.CANCELLED,
                cancelledAt: new Date().toISOString(),
            }
        );

        await databases.listDocuments(
            DATABASE_ID,
            ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
            [Query.equal("orderId", orderId)]
        ).then(fulfillments => {
            return Promise.all(
                fulfillments.documents.map(fulfillment =>
                    databases.updateDocument(
                        DATABASE_ID,
                        ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
                        fulfillment.$id,
                        { status: 'cancelled' }
                    )
                )
            );
        });

        return {
            success: "Order cancelled successfully",
            data: updatedOrder
        };
    } catch (error) {
        console.error("cancelOrder error:", error);
        return { error: "Failed to cancel order" };
    }
}

export async function getOrderById(orderId: string) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const { databases } = await createSessionClient();

        const order = await databases.getDocument(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            orderId
        );

        // Verify user owns this order
        if (order.customerId !== user.$id) {
            return { error: "Access denied" };
        }

        // Get order items
        const orderItems = await databases.listDocuments(
            DATABASE_ID,
            ORDER_ITEMS_COLLECTION_ID,
            [Query.equal("orderId", orderId)]
        );

        return {
            success: true,
            data: {
                ...order,
                items: orderItems.documents
            }
        };
    } catch (error) {
        console.error("getOrderById error:", error);
        return { error: "Failed to fetch order" };
    }
}

export async function getLogedInUserOrders(
    options: {
        limit?: number;
        offset?: number;
        status?: OrderStatus;
    } = {}
) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const { databases } = await createSessionClient();

        const queries = [
            Query.equal("customerId", user.$id),
            Query.orderDesc("$createdAt"),
            Query.limit(options.limit || 25),
            Query.offset(options.offset || 0)
        ];

        if (options.status) {
            queries.push(Query.equal("status", options.status));
        }

        const orders = await databases.listDocuments(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            queries
        );

        return {
            success: true,
            data: orders
        };
    } catch (error) {
        console.error("getUserOrders error:", error);
        return { error: "Failed to fetch orders" };
    }
}

export async function getPhysicalStoreFulfillmentOrders(
    physicalStoreId: string,
    options: {
        status?: PhysicalStoreFulfillmentOrderStatus;
        limit?: number;
        offset?: number;
    } = {}
) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const { databases } = await createSessionClient();

        const queries = [
            Query.equal("physicalStoreId", physicalStoreId),
            Query.orderDesc("$createdAt"),
            Query.limit(options.limit || 25),
            Query.offset(options.offset || 0)
        ];

        if (options.status) {
            queries.push(Query.equal("status", options.status));
        }

        const fulfillmentOrders = await databases.listDocuments(
            DATABASE_ID,
            ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
            queries
        );

        const ordersWithDetails = await Promise.all(
            fulfillmentOrders.documents.map(async (fulfillment) => {
                const order = await databases.getDocument(
                    DATABASE_ID,
                    ORDERS_COLLECTION_ID,
                    fulfillment.orderId
                );

                const orderItems = await databases.listDocuments(
                    DATABASE_ID,
                    ORDER_ITEMS_COLLECTION_ID,
                    [
                        Query.equal("orderId", fulfillment.orderId),
                        Query.equal("physicalStoreId", physicalStoreId)
                    ]
                );

                return {
                    ...fulfillment,
                    orderDetails: order,
                    items: orderItems.documents
                };
            })
        );

        return {
            success: true,
            data: {
                documents: ordersWithDetails,
                total: fulfillmentOrders.total
            }
        };
    } catch (error) {
        console.error("getPhysicalStoreFulfillmentOrders error:", error);
        return { error: "Failed to fetch fulfillment orders" };
    }
}

export async function updateFulfillmentStatus(
    fulfillmentId: string,
    status: PhysicalStoreFulfillmentOrderStatus,
    trackingNumber?: string
) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const { databases } = await createSessionClient();

        const updateData: any = {
            status,
        };

        if (status === 'shipped' && trackingNumber) {
            updateData.trackingNumber = trackingNumber;
            updateData.shippedAt = new Date().toISOString();
        }

        if (status === 'completed') {
            updateData.completedAt = new Date().toISOString();
        }

        const updatedFulfillment = await databases.updateDocument(
            DATABASE_ID,
            ORDER_FULFILLMENT_RECORDS_COLLECTION_ID,
            fulfillmentId,
            updateData
        );

        return {
            success: "Fulfillment status updated successfully",
            data: updatedFulfillment
        };
    } catch (error) {
        console.error("updateFulfillmentStatus error:", error);
        return { error: "Failed to update fulfillment status" };
    }
}

export async function getVirtualStoreOrders(
    virtualStoreId: string,
    options: {
        status?: OrderStatus;
        limit?: number;
        offset?: number;
    } = {}
) {
    try {
        const { user } = await getAuthState();
        if (!user) {
            return { error: "Authentication required" };
        }

        const { databases } = await createSessionClient();

        const queries = [
            Query.equal("virtualStoreId", virtualStoreId),
            Query.orderDesc("$createdAt"),
            Query.limit(options.limit || 25),
            Query.offset(options.offset || 0)
        ];

        if (options.status) {
            queries.push(Query.equal("status", options.status));
        }

        const orders = await databases.listDocuments(
            DATABASE_ID,
            ORDERS_COLLECTION_ID,
            queries
        );

        return {
            success: true,
            data: orders
        };
    } catch (error) {
        console.error("getVirtualStoreOrders error:", error);
        return { error: "Failed to fetch virtual store orders" };
    }
}
// Send notifications to:
// 1. Customer - order confirmation
// 2. Virtual store owner - new sale notification with commission details
// 3. Physical store owners - fulfillment requests