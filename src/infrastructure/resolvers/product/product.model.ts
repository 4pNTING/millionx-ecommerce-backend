import { ActiveStatus } from '../../../domain/enums/enum';
import { LoadPageDto } from '../../common/graphql/load-page.dto';
import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

@ObjectType()
export class ProductPrice {
  @Field()
  _id: string;

  @Field()
  variantId: string;

  @Field()
  currency: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Float, { nullable: true })
  compareAtAmount?: number;

  @Field({ nullable: true })
  startsAt?: Date;

  @Field({ nullable: true })
  endsAt?: Date;

  @Field()
  isActive: boolean;
}

@ObjectType()
export class ProductImage {
  @Field()
  _id: string;

  @Field()
  productId: string;

  @Field({ nullable: true })
  variantId?: string;

  @Field()
  url: string;

  @Field({ nullable: true })
  altText?: string;

  @Field(() => Int)
  sortOrder: number;
}

@ObjectType()
export class ProductVariant {
  @Field()
  _id: string;

  @Field()
  productId: string;

  @Field()
  sku: string;

  @Field({ nullable: true })
  barcode?: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  attributesJson: string;

  @Field()
  isActive: boolean;

  @Field(() => [ProductPrice])
  prices: ProductPrice[];
}

@ObjectType()
export class Product {
  @Field()
  _id: string;

  @Field()
  categoryId: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ProductVariant])
  variants: ProductVariant[];

  @Field(() => [ProductImage])
  images: ProductImage[];
}

@ObjectType()
export class ProductPage {
  @Field(() => [Product])
  items: Product[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@InputType()
export class LoadProductDto extends LoadPageDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  includeDescendants?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @Length(3, 3)
  currency?: string;

  @Field(() => ActiveStatus, { nullable: true, defaultValue: ActiveStatus.active })
  @IsOptional()
  @IsEnum(ActiveStatus)
  isActive?: ActiveStatus;
}

@InputType()
export class CreateProductDto {
  @Field()
  @IsUUID()
  categoryId: string;

  @Field()
  @IsString()
  @MaxLength(200)
  name: string;

  @Field()
  @IsString()
  @MaxLength(220)
  slug: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;
}

@InputType()
export class CreateProductVariantDto {
  @Field()
  @IsUUID()
  productId: string;

  @Field()
  @IsString()
  @MaxLength(100)
  sku: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  attributesJson?: string;
}

@InputType()
export class SetProductPriceDto {
  @Field()
  @IsUUID()
  variantId: string;

  @Field()
  @Length(3, 3)
  currency: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtAmount?: number;

  @Field({ nullable: true })
  @IsOptional()
  startsAt?: Date;
}

@InputType()
export class AddProductImageDto {
  @Field()
  @IsUUID()
  productId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @Field()
  @IsString()
  url: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateProductImageDto {
  @Field()
  @IsUUID()
  _id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  variantId?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  url?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateProductPriceDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  _id?: string;

  @Field()
  @Length(3, 3)
  currency: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtAmount?: number | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  startsAt?: Date | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class UpdateProductVariantDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  _id?: string;

  @Field()
  @IsString()
  @MaxLength(100)
  sku: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  attributesJson?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => [UpdateProductPriceDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductPriceDto)
  prices?: UpdateProductPriceDto[];
}

@InputType()
export class UpdateProductBundleImageDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  _id?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  variantId?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  variantSku?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  url?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class UpdateProductDto {
  @Field()
  @IsUUID()
  _id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => [UpdateProductVariantDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];

  @Field(() => [UpdateProductBundleImageDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductBundleImageDto)
  images?: UpdateProductBundleImageDto[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  deleteImageIds?: string[];
}

@InputType()
export class DeleteProductImageDto {
  @Field()
  @IsUUID()
  _id: string;
}

@InputType()
export class ProductBundlePriceDto {
  @Field()
  @Length(3, 3)
  currency: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtAmount?: number;

  @Field({ nullable: true })
  @IsOptional()
  startsAt?: Date;
}

@InputType()
export class ProductBundleImageDto {
  @Field()
  @IsString()
  url: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

@InputType()
export class ProductBundleVariantDto {
  @Field()
  @IsString()
  @MaxLength(100)
  sku: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  attributesJson?: string;

  @Field(() => [ProductBundlePriceDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductBundlePriceDto)
  prices?: ProductBundlePriceDto[];

  @Field(() => [ProductBundleImageDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductBundleImageDto)
  images?: ProductBundleImageDto[];
}

@InputType()
export class CreateProductBundleDto {
  @Field()
  @IsUUID()
  categoryId: string;

  @Field()
  @IsString()
  @MaxLength(200)
  name: string;

  @Field()
  @IsString()
  @MaxLength(220)
  slug: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;

  @Field(() => [ProductBundleVariantDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductBundleVariantDto)
  variants?: ProductBundleVariantDto[];

  @Field(() => [ProductBundleImageDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductBundleImageDto)
  images?: ProductBundleImageDto[];
}
