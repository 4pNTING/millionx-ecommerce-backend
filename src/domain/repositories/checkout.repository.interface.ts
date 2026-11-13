import {
  CheckoutSessionModel,
  CreateCheckoutSessionRequest,
} from '../models/checkout-session.model';

export interface ICheckoutRepository {
  createCheckoutSession(input: CreateCheckoutSessionRequest): Promise<CheckoutSessionModel>;
  getCheckoutSession(sessionId: string, customerId?: string): Promise<CheckoutSessionModel | null>;
}
