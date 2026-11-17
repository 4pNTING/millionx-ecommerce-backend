import { OrderStatus } from '../../domain/models/order.model';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(orderId: string, status: OrderStatus, note?: string, changedBy?: string) {
    return this.orderRepository.updateOrderStatus(orderId, status, note, changedBy);
  }
}
