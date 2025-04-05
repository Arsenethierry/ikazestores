"use server"

import { authMiddleware } from "@/lib/actions/middlewares"
import { AppwriteRollback } from "@/lib/actions/rollback"
import { createSessionClient } from "@/lib/appwrite"
import { OrderStatus } from "@/lib/constants"
import { DATABASE_ID, DELIVERY_ADDRESS_ID, ORDER_ID, ORDER_ITEM_ID } from "@/lib/env-config"
import { OrderSchema } from "@/lib/schemas/products-schems"
import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { ID, Query } from "node-appwrite"

const action = createSafeActionClient({
    handleServerError: (error) => {
        return error.message
    },
})

export const createOrder = action
    .use(authMiddleware)
    .schema(OrderSchema)
    .action(async ({ parsedInput: orderData, ctx }) => {
        const { databases, user, storage } = ctx;
        const rollback = new AppwriteRollback(storage, databases)

        try {

            const addressData = orderData.deliveryAddress.$id ?
                orderData.deliveryAddress
                : await databases.createDocument(
                    DATABASE_ID,
                    DELIVERY_ADDRESS_ID,
                    ID.unique(),
                    {
                        customerId: user.$id,
                        fullName: orderData.deliveryAddress.fullName ?? null,
                        phoneNumber: orderData.deliveryAddress.phoneNumber ?? null,
                        street: orderData.deliveryAddress.street ?? null,
                        city: orderData.deliveryAddress.city ?? null,
                        zip: orderData.deliveryAddress.zip ?? null,
                        state: orderData.deliveryAddress.state ?? null,
                        country: orderData.deliveryAddress.country ?? null,
                    }
                )

            if (!orderData.deliveryAddress.$id && addressData.$id) {
                await rollback.trackDocument(DELIVERY_ADDRESS_ID, addressData.$id);
            }

            const newOrder = await ctx.databases.createDocument(
                DATABASE_ID,
                ORDER_ID,
                ID.unique(),
                {
                    customerId: user.$id,
                    orderDate: orderData.orderDate,
                    status: OrderStatus.PENDING,
                    deliveryAddressId: addressData.$id,
                    totalAmount: orderData.totalAmount,
                    notes: orderData.notes,
                }
            );
            await rollback.trackDocument(ORDER_ID, newOrder.$id);

            const orderItems = await Promise.all(
                orderData.selectedItems.map(async (item) => {
                    const docId = ID.unique();

                    const order = await ctx.databases.createDocument(
                        DATABASE_ID,
                        ORDER_ITEM_ID,
                        docId,
                        {
                            productId: item.productId,
                            price: item.price,
                            quantity: item.quantity,
                            order: newOrder.$id
                        }
                    );
                    await rollback.trackDocument(ORDER_ITEM_ID, order.$id);

                    return {
                        orderItemId: order.$id
                    };
                }) || []
            );

            console.log(`ordered items: ${JSON.stringify(orderItems)}`)
            revalidatePath('/my-orders')
            return { success: 'Your order has been submitted successfully' };
        } catch (error) {
            console.log("createOrder eror: ", error);
            await rollback.rollback();
            return { error: error instanceof Error ? error.message : "Failed to create new order" };
        }
    })

export const getDeliveryAddresses = async (customerId: string) => {
    if (!customerId) return { documents: [], total: 0 };

    try {
        const { databases } = await createSessionClient();
        const response = await databases.listDocuments(
            DATABASE_ID,
            DELIVERY_ADDRESS_ID,
            [Query.equal("customerId", customerId)]
        );

        return response;
    } catch (error) {
        console.log("getDeliveryAddresses error: ", error);
        return { documents: [], total: 0 };
    }
};

export const getAllCustomerOrders = async (customerId: string) => {
    try {
        const { databases } = await createSessionClient();

        const orders = await databases.listDocuments(
            DATABASE_ID,
            ORDER_ID,
            [Query.equal("customerId", customerId)]
        );

        return orders
    } catch (error) {
        console.log("getDeliveryAddresses error: ", error);
        return { documents: [], total: 0 };
    }
}