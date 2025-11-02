import z from "zod";
import { OnlinePaymentProvider } from "../constants";

const rwandaPhoneRegex = /^250(78|79|72|73)\d{7}$/;

export const InitiatePaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.literal("RWF"),
  phoneNumber: z
    .string()
    .regex(
      rwandaPhoneRegex,
      "Invalid Rwanda phone number. Format: 250XXXXXXXXX"
    ),
  provider: z.nativeEnum(OnlinePaymentProvider, {
    errorMap: () => ({ message: "Invalid payment provider" }),
  }),
  customerEmail: z.string().email().optional(),
  metadata: z.record(z.string()).optional(),
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;

export const CheckPaymentStatusSchema = z.object({
  paymentTransactionId: z.string().min(1, "Payment transaction ID is required"),
});

export type CheckPaymentStatusInput = z.infer<typeof CheckPaymentStatusSchema>;

export const CancelPaymentSchema = z.object({
  paymentTransactionId: z.string().min(1, "Payment transaction ID is required"),
  reason: z.string().optional(),
});

export type CancelPaymentInput = z.infer<typeof CancelPaymentSchema>;

export const VerifyWebhookSchema = z.object({
  signature: z.string().min(1, "Webhook signature is required"),
  payload: z.string().min(1, "Webhook payload is required"),
});

export const PawapayWebhookSchema = z.object({
  depositId: z.string(),
  status: z.enum(["ACCEPTED", "SUBMITTED", "COMPLETED", "FAILED", "REJECTED"]),
  requestedAmount: z.object({
    value: z.string(),
    currency: z.literal("RWF"),
  }),
  depositedAmount: z
    .object({
      value: z.string(),
      currency: z.literal("RWF"),
    })
    .optional(),
  correspondent: z.enum(["MTN_MOMO_RWA", "AIRTEL_OAPI_RWA"]),
  payer: z.object({
    type: z.literal("MSISDN"),
    address: z.object({
      value: z.string(),
    }),
  }),
  created: z.string(),
  respondedByPayer: z.string().optional(),
  correspondentIds: z
    .object({
      transactionId: z.string().optional(),
    })
    .optional(),
  failureReason: z
    .object({
      failureCode: z.string(),
      failureMessage: z.string(),
    })
    .optional(),
  metadata: z.record(z.string()).optional(),
});

export type PawapayWebhookPayload = z.infer<typeof PawapayWebhookSchema>;
