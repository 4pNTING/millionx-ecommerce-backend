import {
  CreateOrderRequest,
  LoadOrdersRequest,
  OrderListResult,
  OrderModel,
  OrderStatus,
} from '../models/order.model';

export interface IOrderRepository {
  createOrderFromCheckout(input: CreateOrderRequest): Promise<OrderModel>;
  loadOrders(input: LoadOrdersRequest): Promise<OrderListResult>;
  loadOrderById(orderId: string, customerId?: string): Promise<OrderModel | null>;
  findOrderByOrderNumber(orderNumber: string): Promise<OrderModel | null>;
  cancelOrder(orderId: string, customerId?: string, reason?: string): Promise<OrderModel>;
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    changedBy?: string,
  ): Promise<OrderModel>;
}
