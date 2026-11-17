import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

export class CancelOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(orderId: string, customerId?: string, reason?: string) {
    return this.orderRepository.cancelOrder(orderId, customerId, reason);
  }
}
