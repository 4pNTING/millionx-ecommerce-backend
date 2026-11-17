import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@ObjectType()
export class OrderShippingAddressOutput {
  @Field()
  recipientName: string;

  @Field()
  phone: string;

  @Field()
  addressLine1: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  stateProvince?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  country?: string;
}

@InputType()
export class OrderShippingAddressInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stateProvince?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;
}

@ObjectType()
export class OrderItem {
  @Field()
  _id: string;

  @Field()
  orderId: string;

  @Field()
  variantId: string;

  @Field()
  sku: string;

  @Field()
  productName: string;

  @Field()
  variantName: string;

  @Field(() => Int)
  quantity: number;

  @Field()
  unitPrice: string;

  @Field()
  subtotal: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class OrderStatusHistory {
  @Field()
  _id: string;

  @Field()
  orderId: string;

  @Field({ nullable: true })
  fromStatus?: string;

  @Field()
  toStatus: string;

  @Field({ nullable: true })
  note?: string;

  @Field()
  createdBy: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class Order {
  @Field()
  _id: string;

  @Field()
  orderNumber: string;

  @Field()
  customerId: string;

  @Field({ nullable: true })
  checkoutSessionId?: string;

  @Field()
  subtotal: string;

  @Field()
  discountAmount: string;

  @Field()
  shippingAmount: string;

  @Field()
  taxAmount: string;

  @Field()
  total: string;

  @Field()
  currency: string;

  @Field()
  status: string;

  @Field(() => OrderShippingAddressOutput)
  shippingAddress: OrderShippingAddressOutput;

  @Field(() => OrderShippingAddressOutput, { nullable: true })
  billingAddress?: OrderShippingAddressOutput;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [OrderItem])
  items: OrderItem[];

  @Field(() => [OrderStatusHistory])
  statusHistory: OrderStatusHistory[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class OrderListPayload {
  @Field(() => [Order])
  items: Order[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@InputType()
export class CreateOrderDto {
  @Field()
  @IsUUID('4')
  checkoutSessionId: string;

  @Field(() => OrderShippingAddressInput)
  @ValidateNested()
  @Type(() => OrderShippingAddressInput)
  shippingAddress: OrderShippingAddressInput;

  @Field(() => OrderShippingAddressInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderShippingAddressInput)
  billingAddress?: OrderShippingAddressInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class CancelOrderDto {
  @Field()
  @IsUUID('4')
  _id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}

@InputType()
export class UpdateOrderStatusDto {
  @Field()
  @IsUUID('4')
  _id: string;

  @Field()
  @IsString()
  status: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}

@InputType()
export class LoadOrderDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field(() => Int, { defaultValue: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 20, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
