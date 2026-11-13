import { Repository } from 'typeorm';
import { CheckoutSessionEntity } from '../../../entities/checkout-session.entity';
import { CheckoutSessionModel } from '../../../../domain/models/checkout-session.model';

export class GetCheckoutSessionAction {
  constructor(private readonly checkoutRepo: Repository<CheckoutSessionEntity>) {}

  async execute(sessionId: string, customerId?: string): Promise<CheckoutSessionModel | null> {
    const session = await this.checkoutRepo.findOne({
      where: { _id: sessionId },
    });

    if (!session) return null;

    if (customerId && session.customerId && session.customerId !== customerId) {
      return null;
    }

    // Auto-expire if open and past expiresAt
    if (session.status === 'open' && new Date(session.expiresAt) < new Date()) {
      session.status = 'expired';
      await this.checkoutRepo.save(session);
    }

    return session;
  }
}
