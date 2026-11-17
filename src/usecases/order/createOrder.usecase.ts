import { CreateOrderRequest } from '../../domain/models/order.model';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  execute(input: CreateOrderRequest) {
    return this.orderRepository.createOrderFromCheckout(input);
  }
}
