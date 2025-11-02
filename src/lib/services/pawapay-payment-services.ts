import {
  PAWAPAY_API_KEY,
  PAWAPAY_API_URL,
  PAWAPAY_WEBHOOK_SECRET,
} from "../env-config";
import {
  PawapayDepositRequest,
  PawapayDepositResponse,
  PawapayErrorResponse,
  PawapayProvider,
  PawapayStatus,
} from "../types/payment-types";
import { timingSafeEqual, createHmac } from "crypto";

export class PawapayService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor() {
    this.baseUrl = PAWAPAY_API_URL;
    this.apiKey = PAWAPAY_API_KEY;
    this.webhookSecret = PAWAPAY_WEBHOOK_SECRET;

    if (!this.apiKey || !this.baseUrl) {
      throw new Error(
        "PawaPay configuration is missing. Check environment variables"
      );
    }
  }

  async createDeposit(
    request: PawapayDepositRequest
  ): Promise<
    | { success: true; data: PawapayDepositResponse }
    | { success: false; error: string }
  > {
    try {
      const response = await fetch(`${this.baseUrl}/deposits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as PawapayErrorResponse;
        console.error("PawaPay API Error:", errorData);

        return {
          success: false,
          error: this.formatErrorMessage(errorData),
        };
      }

      const data = (await response.json()) as PawapayDepositResponse;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("PawaPay Service Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create payment",
      };
    }
  }

  async getDepositStatus(
    depositId: string
  ): Promise<
    | { success: true; data: PawapayDepositResponse }
    | { success: false; error: string }
  > {
    try {
      const response = await fetch(`${this.baseUrl}/deposits/${depositId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as PawapayErrorResponse;
        console.error("PawaPay Status Check Error:", errorData);

        return {
          success: false,
          error: this.formatErrorMessage(errorData),
        };
      }

      const data = (await response.json()) as PawapayDepositResponse;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("PawaPay Status Check Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check payment status",
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = createHmac("sha256", this.webhookSecret)
        .update(payload)
        .digest("hex");

      return timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, "");

    // If starts with 0, replace with country code
    if (cleaned.startsWith("0")) {
      cleaned = "250" + cleaned.slice(1);
    }

    // If doesn't start with 250, add it
    if (!cleaned.startsWith("250")) {
      cleaned = "250" + cleaned;
    }

    return cleaned;
  }

  generateDepositId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `DEP_${timestamp}_${random}`.toUpperCase();
  }

  mapPawapayStatusToInternal(status: PawapayStatus): string {
    switch (status) {
      case PawapayStatus.ACCEPTED:
      case PawapayStatus.SUBMITTED:
        return "processing";
      case PawapayStatus.COMPLETED:
        return "completed";
      case PawapayStatus.FAILED:
      case PawapayStatus.REJECTED:
        return "failed";
      default:
        return "pending";
    }
  }

  isPaymentFinal(status: PawapayStatus): boolean {
    return [
      PawapayStatus.COMPLETED,
      PawapayStatus.FAILED,
      PawapayStatus.REJECTED,
    ].includes(status);
  }

  private formatErrorMessage(error: PawapayErrorResponse): string {
    if (error.fieldErrors && error.fieldErrors.length > 0) {
      return error.fieldErrors.map((fe) => fe.message).join(", ");
    }

    const errorMessages: Record<string, string> = {
      PAYER_NOT_FOUND: "Phone number not found. Please check and try again.",
      NOT_ALLOWED: "This transaction is not allowed. Please contact support.",
      INSUFFICIENT_BALANCE:
        "Insufficient balance. Please top up and try again.",
      DECLINED:
        "Payment was declined. Please try again or use a different method.",
      TIMEOUT: "Payment request timed out. Please try again.",
      INTERNAL_ERROR: "A system error occurred. Please try again later.",
    };

    return (
      errorMessages[error.errorCode] ||
      error.errorMessage ||
      "Payment failed. Please try again."
    );
  }

  getPaymentProvider(providerCode: string): PawapayProvider {
    const providerMap: Record<string, PawapayProvider> = {
      MTN: PawapayProvider.MTN_RWANDA,
      AIRTEL: PawapayProvider.AIRTEL_RWANDA,
    };

    return providerMap[providerCode] || PawapayProvider.MTN_RWANDA;
  }
}
