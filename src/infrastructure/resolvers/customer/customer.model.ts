import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@ObjectType()
export class CustomerAddress {
  @Field() id: string;
  @Field() customerId: string;
  @Field() label: string;
  @Field() recipientName: string;
  @Field() phone: string;
  @Field() addressLine1: string;
  @Field({ nullable: true }) addressLine2?: string;
  @Field({ nullable: true }) village?: string;
  @Field({ nullable: true }) district?: string;
  @Field() province: string;
  @Field({ nullable: true }) postalCode?: string;
  @Field() countryCode: string;
  @Field(() => Float, { nullable: true }) latitude?: number;
  @Field(() => Float, { nullable: true }) longitude?: number;
  @Field() isDefault: boolean;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class CustomerProfile {
  @Field() id: string;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) lastName?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) phone?: string;
  @Field() isActive: boolean;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
  @Field(() => [CustomerAddress]) addresses: CustomerAddress[];
}

@InputType()
export class UpsertCustomerProfileDto {
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(120) firstName?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(120) lastName?: string;
  @Field({ nullable: true }) @IsOptional() @IsEmail() @MaxLength(320) email?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

@InputType()
export class CreateCustomerAddressDto {
  @Field() @IsString() @MaxLength(80) label: string;
  @Field() @IsString() @MaxLength(200) recipientName: string;
  @Field() @IsString() @MaxLength(40) phone: string;
  @Field() @IsString() @MaxLength(250) addressLine1: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(250) addressLine2?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) village?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) district?: string;
  @Field() @IsString() @MaxLength(150) province: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(30) postalCode?: string;
  @Field({ nullable: true, defaultValue: 'LA' }) @IsOptional() @Length(2, 2) countryCode?: string;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
  @Field({ nullable: true, defaultValue: false }) @IsOptional() @IsBoolean() isDefault?: boolean;
}

@InputType()
export class UpdateCustomerAddressDto {
  @Field() @IsUUID() id: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(80) label?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(200) recipientName?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(250) addressLine1?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(250) addressLine2?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) village?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) district?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(150) province?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(30) postalCode?: string;
  @Field({ nullable: true }) @IsOptional() @Length(2, 2) countryCode?: string;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() isDefault?: boolean;
}
