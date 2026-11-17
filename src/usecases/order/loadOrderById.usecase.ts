import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

export class LoadOrderByIdUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(orderId: string, customerId?: string) {
    return this.orderRepository.loadOrderById(orderId, customerId);
  }
}
