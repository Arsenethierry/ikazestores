export enum PawapayProvider {
  MTN_RWANDA = "MTN_MOMO_RWA",
  AIRTEL_RWANDA = "AIRTEL_OAPI_RWA",
}

export enum PawapayStatus {
  ACCEPTED = "ACCEPTED",
  SUBMITTED = "SUBMITTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REJECTED = "REJECTED",
}

// export enum PaymentStatus {
//     PENDING = "PENDING",
//     ACCEPTED = "ACCEPTED",
//     COMPLETED = "COMPLETED",
//     FAILED = "FAILED",
//     REJECTED = "REJECTED"
// }

export enum PawapayFailureReason {
  PAYER_NOT_FOUND = "PAYER_NOT_FOUND",
  NOT_ALLOWED = "NOT_ALLOWED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  DECLINED = "DECLINED",
  TIMEOUT = "TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

// Request Types
export interface PawapayDepositRequest {
  depositId: string; // Unique transaction ID from your system
  amount: string; // Amount in smallest currency unit (e.g., "1000" for 1000 RWF)
  currency: "RWF";
  correspondent: PawapayProvider;
  payer: {
    type: "MSISDN";
    address: {
      value: string; // Phone number in format: 250788123456
    };
  };
  customerTimestamp: string; // ISO 8601 format
  statementDescription: string; // What the customer sees on their statement
  metadata?: Record<string, string>; // Optional metadata
}

export interface PawapayDepositResponse {
  depositId: string;
  status: PawapayStatus;
  requestedAmount: {
    value: string;
    currency: "RWF";
  };
  depositedAmount?: {
    value: string;
    currency: "RWF";
  };
  correspondent: PawapayProvider;
  payer: {
    type: "MSISDN";
    address: {
      value: string;
    };
  };
  customerTimestamp: string;
  statementDescription: string;
  created: string; // ISO 8601 timestamp
  respondedByPayer?: string; // ISO 8601 timestamp
  correspondentIds?: {
    transactionId?: string;
  };
  failureReason?: {
    failureCode: PawapayFailureReason;
    failureMessage: string;
  };
  metadata?: Record<string, string>;
}

// Webhook Callback Types
export interface PawapayWebhookPayload {
  depositId: string;
  status: PawapayStatus;
  requestedAmount: {
    value: string;
    currency: "RWF";
  };
  depositedAmount?: {
    value: string;
    currency: "RWF";
  };
  correspondent: PawapayProvider;
  payer: {
    type: "MSISDN";
    address: {
      value: string;
    };
  };
  created: string;
  respondedByPayer?: string;
  correspondentIds?: {
    transactionId?: string;
  };
  failureReason?: {
    failureCode: PawapayFailureReason;
    failureMessage: string;
  };
  metadata?: Record<string, string>;
}

// Error Response
export interface PawapayErrorResponse {
  errorCode: string;
  errorMessage: string;
  fieldErrors?: Array<{
    field: string;
    errorCode: string;
    message: string;
  }>;
}

// Payment Transaction Status (Internal)
export enum PaymentTransactionStatus {
  PENDING = "pending",
  SUBMITTED = "submitted",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

// Payment Provider Mapping
export const PAYMENT_PROVIDER_MAP: Record<string, PawapayProvider> = {
  MTN: PawapayProvider.MTN_RWANDA,
  AIRTEL: PawapayProvider.AIRTEL_RWANDA,
};

export const PROVIDER_DISPLAY_NAMES: Record<PawapayProvider, string> = {
  [PawapayProvider.MTN_RWANDA]: "MTN Mobile Money",
  [PawapayProvider.AIRTEL_RWANDA]: "Airtel Money",
};
