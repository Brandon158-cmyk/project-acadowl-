// Generic API response types

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// Webhook payload types
export interface AirtelMoneyWebhookPayload {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  phone: string;
  reference: string;
  timestamp: string;
}

export interface MtnMomoWebhookPayload {
  externalId: string;
  amount: string;
  currency: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  payerPartyId: string;
  payeeNote: string;
}
