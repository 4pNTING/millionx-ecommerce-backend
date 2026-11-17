import { LoadOrdersRequest } from '../../domain/models/order.model';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

export class LoadOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(input: LoadOrdersRequest) {
    return this.orderRepository.loadOrders(input);
  }
}
