import { BaseModel, QueryOptions } from "../core/database";
import {
  PAYMENT_TIMEOUT_MINUTES,
  PAYMENT_TRANSACTIONS_COLLECTION_ID,
} from "../env-config";
import {
  PaymentStatus,
  PaymentTransactions,
  TransactionStatus,
} from "../types/appwrite-types";
import { PawapayStatus } from "../types/payment-types";

export class PaymentModel extends BaseModel<PaymentTransactions> {
  constructor() {
    super(PAYMENT_TRANSACTIONS_COLLECTION_ID);
  }

  async createPaymentTransaction(data: {
    orderId: string;
    customerId: string;
    virtualStoreId: string;
    paymentProvider: "PAWAPAY_MTN" | "PAWAPAY_AIRTEL";
    paymentMethod: string;
    amount: number;
    currency: "RWF";
    phoneNumber: string;
    pawapayDepositId: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentTransactions> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000
    );

    const transactionData = {
      orderId: data.orderId,
      customerId: data.customerId,
      virtualStoreId: data.virtualStoreId,
      paymentProvider: data.paymentProvider,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      currency: data.currency,
      phoneNumber: data.phoneNumber,
      pawapayDepositId: data.pawapayDepositId,
      pawapayTransactionId: null,
      transactionStatus: "pending" as const,
      paymentStatus: "PENDING" as PawapayStatus,
      failureReason: null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      initiatedAt: now.toISOString(),
      completedAt: null,
      expiresAt: expiresAt.toISOString(),
      webhookReceived: false,
      webhookData: null,
      retryCount: 0,
    } as any;

    return this.create(transactionData, data.customerId);
  }

  async findByDepositId(
    depositId: string
  ): Promise<PaymentTransactions | null> {
    return this.findOneByField("pawapayDepositId", depositId);
  }

  async findByOrderId(
    orderId: string,
    options: QueryOptions = {}
  ): Promise<PaymentTransactions[]> {
    const result = await this.findByField("orderId", orderId, {
      ...options,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    return result.documents;
  }

  async updatePaymentStatus(
    paymentId: string,
    transactionStatus: TransactionStatus,
    paymentStatus: PaymentStatus,
    additionalData?: {
      pawapayTransactionId?: string;
      failureReason?: string;
      webhookData?: any;
    }
  ): Promise<PaymentTransactions> {
    const updates: Partial<PaymentTransactions> = {
      transactionStatus,
      paymentStatus,
    };

    if (transactionStatus === "completed") {
      updates.completedAt = new Date().toISOString();
    }

    if (additionalData?.pawapayTransactionId) {
      updates.pawapayTransactionId = additionalData.pawapayTransactionId;
    }

    if (additionalData?.failureReason) {
      updates.failureReason = additionalData.failureReason;
    }

    if (additionalData?.webhookData) {
      updates.webhookReceived = true;
      updates.webhookData = JSON.stringify(additionalData.webhookData);
    }

    return this.updatePartial(paymentId, updates);
  }

  async markAsSubmitted(paymentId: string): Promise<PaymentTransactions> {
    return this.updatePaymentStatus(
      paymentId,
      TransactionStatus.COMPLETED,
      PaymentStatus.ACCEPTED
    );
  }

  async cancelPayment(
    paymentId: string,
    reason?: string
  ): Promise<PaymentTransactions> {
    return this.updatePartial(paymentId, {
      status: "cancelled",
      failureReason: reason || "Cancelled by user",
    });
  }

  async incrementRetryCount(paymentId: string): Promise<PaymentTransactions> {
    return this.incrementField(
      paymentId,
      "retryCount" as keyof PaymentTransactions,
      1
    );
  }

  async findExpiredPayments(): Promise<PaymentTransactions[]> {
    const now = new Date().toISOString();

    const result = await this.findMany({
      filters: [
        { field: "status", operator: "equal", value: "pending" },
        { field: "expiresAt", operator: "lessThan", value: now },
      ],
      limit: 100,
    });

    return result.documents;
  }

  async markAsExpired(paymentId: string): Promise<PaymentTransactions> {
    return this.updatePaymentStatus(
      paymentId,
      TransactionStatus.EXPIRED,
      PaymentStatus.FAILED,
      {
        failureReason: "Payment request expired",
      }
    );
  }

  async getCustomerPayments(
    customerId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: TransactionStatus;
    }
  ): Promise<{ documents: PaymentTransactions[]; total: number }> {
    const filters: any[] = [
      { field: "customerId", operator: "equal", value: customerId },
    ];

    if (options?.status) {
      filters.push({
        field: "status",
        operator: "equal",
        value: options.status,
      });
    }

    const result = await this.findMany({
      filters,
      limit: options?.limit || 25,
      offset: options?.offset || 0,
      orderBy: "$createdAt",
      orderType: "desc",
    });

    return {
      documents: result.documents,
      total: result.total,
    };
  }

  async getSuccessfulPaymentForOrder(
    orderId: string
  ): Promise<PaymentTransactions | null> {
    const result = await this.findMany({
      filters: [
        { field: "orderId", operator: "equal", value: orderId },
        { field: "status", operator: "equal", value: "completed" },
      ],
      limit: 1,
    });

    return result.documents[0] || null;
  }
}
