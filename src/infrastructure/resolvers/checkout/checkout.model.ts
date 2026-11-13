import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID } from 'class-validator';

@ObjectType()
export class PriceSnapshotItem {
  @Field()
  variantId: string;

  @Field()
  sku: string;

  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field({ nullable: true })
  variantName?: string;

  @Field(() => Int)
  quantity: number;

  @Field()
  unitPrice: string;

  @Field({ nullable: true })
  compareAtPrice?: string;

  @Field()
  currency: string;

  @Field()
  subtotal: string;
}

@ObjectType()
export class CheckoutSession {
  @Field()
  _id: string;

  @Field()
  cartId: string;

  @Field({ nullable: true })
  customerId?: string;

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

  @Field(() => [PriceSnapshotItem])
  priceSnapshot: PriceSnapshotItem[];

  @Field()
  status: string;

  @Field()
  expiresAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateCheckoutSessionDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('4')
  cartId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  shippingAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  taxAmount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  discountAmount?: string;
}
