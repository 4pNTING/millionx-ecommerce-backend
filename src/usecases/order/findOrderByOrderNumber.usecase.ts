import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

export class FindOrderByOrderNumberUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(orderNumber: string) {
    return this.orderRepository.findOrderByOrderNumber(orderNumber);
  }
}
