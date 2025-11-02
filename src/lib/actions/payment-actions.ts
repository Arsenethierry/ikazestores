"use server";

import { createSafeActionClient } from "next-safe-action";
import { InitiatePaymentSchema } from "../schemas/payment-schema";
import { authMiddleware } from "./middlewares";
import { PaymentModel } from "../models/PaymentModel";
import { OrderModel } from "../models/OrderModel";
import { PawapayService } from "../services/pawapay-payment-services";
import { OnlinePaymentProvider, OrderStatus } from "../constants";
import { PawapayDepositRequest, PAYMENT_PROVIDER_MAP } from "../types/payment-types";
import { PaymentStatus, TransactionStatus } from "../types/appwrite-types";

const action = createSafeActionClient({
  handleServerError: (error) => {
    return error instanceof Error ? error.message : "Something went wrong";
  },
});

const pawapayService = new PawapayService();
const paymentModel = new PaymentModel();
const orderModel = new OrderModel();

export const initiatePaymentAction = action
  .use(authMiddleware)
  .schema(InitiatePaymentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const { orderId, amount, currency, phoneNumber, provider, customerEmail, metadata } = parsedInput;

    try {
        const order = await orderModel.findById(orderId, {});
      
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.customerId !== user.$id) {
        throw new Error("Unauthorized: You can only pay for your own orders");
      }

      // Check if order is already paid
      const existingPayment = await paymentModel.getSuccessfulPaymentForOrder(orderId);
      if (existingPayment) {
        throw new Error("This order has already been paid");
      }

      // Validate order status
      if (order.orderStatus === OrderStatus.CANCELLED) {
        throw new Error("Cannot pay for a cancelled order");
      }

      if (order.orderStatus === OrderStatus.DELIVERED) {
        throw new Error("This order has already been delivered");
      }

      // Verify amount matches order total
      if (Math.abs(amount - order.totalAmount) > 0.01) {
        throw new Error("Payment amount does not match order total");
      }

      // Format phone number
      const formattedPhone = pawapayService.formatPhoneNumber(phoneNumber);

      // Generate unique deposit ID
      const depositId = pawapayService.generateDepositId();

      // Map provider to PawaPay correspondent
      const correspondent = PAYMENT_PROVIDER_MAP[provider];
      
      if (!correspondent) {
        throw new Error("Invalid payment provider");
      }

      // Create payment transaction record
      const paymentTransaction = await paymentModel.createPaymentTransaction({
        orderId,
        customerId: user.$id,
        virtualStoreId: order.virtualStoreId,
        paymentProvider: provider === OnlinePaymentProvider.MTN ? "PAWAPAY_MTN" : "PAWAPAY_AIRTEL",
        paymentMethod: "MOBILE_MONEY",
        amount,
        currency,
        phoneNumber: formattedPhone,
        pawapayDepositId: depositId,
        metadata: {
          ...metadata,
          orderNumber: order.orderNumber,
          customerEmail: customerEmail || order.customerEmail || user.email,
        },
      });

      // Prepare PawaPay deposit request
      const depositRequest: PawapayDepositRequest = {
        depositId,
        amount: amount.toString(),
        currency,
        correspondent,
        payer: {
          type: "MSISDN",
          address: {
            value: formattedPhone,
          },
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: `Payment for Order - ${order.orderNumber}`,
        metadata: {
          orderId,
          paymentTransactionId: paymentTransaction.$id,
          virtualStoreId: order.virtualStoreId,
        },
      };

      // Call PawaPay API
      const result = await pawapayService.createDeposit(depositRequest);

      if (!result.success) {
        // Mark payment as failed
        await paymentModel.updatePaymentStatus(
          paymentTransaction.$id,
          TransactionStatus.FAILED,
          PaymentStatus.FAILED,
          { failureReason: result.error }
        );

        throw new Error(result.error);
      }

      // Update payment status based on PawaPay response
      const pawapayStatus = result.data.status;
      const internalStatus = pawapayService.mapPawapayStatusToInternal(pawapayStatus);

      await paymentModel.updatePaymentStatus(
        paymentTransaction.$id,
        internalStatus as any,
        pawapayStatus as any,
        {
          pawapayTransactionId: result.data.correspondentIds?.transactionId,
        }
      );

      await orderModel.updateOrderStatus(
        orderId,
        pawapayStatus === "COMPLETED" ? "confirmed" : "pending"
      );

    } catch (error) {
        
    }
  })