import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

@ObjectType()
export class CartItem {
  @Field()
  _id: string;

  @Field()
  cartId: string;

  @Field()
  variantId: string;

  @Field(() => Int)
  quantity: number;

  @Field()
  addedAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  sku: string;

  @Field({ nullable: true })
  variantName?: string;

  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field()
  productSlug: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  unitPrice?: string;

  @Field({ nullable: true })
  compareAtPrice?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  lineTotal?: string;
}

@ObjectType()
export class Cart {
  @Field()
  _id: string;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  sessionId?: string;

  @Field()
  isActive: boolean;

  @Field(() => Int)
  totalItems: number;

  @Field()
  subtotal: string;

  @Field()
  currency: string;

  @Field(() => [CartItem])
  items: CartItem[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class AddToCartDto {
  @Field()
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

@InputType()
export class UpdateCartItemDto {
  @Field()
  @IsUUID('4')
  @IsNotEmpty()
  _id: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

@InputType()
export class RemoveCartItemDto {
  @Field()
  @IsUUID('4')
  @IsNotEmpty()
  _id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

@InputType()
export class MergeGuestCartDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
