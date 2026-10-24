import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SocialProvider } from '../../../domain/models/customer-auth.model';

registerEnumType(SocialProvider, {
  name: 'SocialProvider',
  description: 'Supported social login providers: GOOGLE or FACEBOOK',
});

@InputType()
export class RegisterCustomerDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @Field({ nullable: true })
  @ValidateIf((value) => !value.phone)
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @Field({ nullable: true })
  @ValidateIf((value) => !value.email)
  @IsString()
  @MaxLength(40)
  phone?: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

@InputType()
export class CustomerLoginDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class SocialLoginCustomerDto {
  @Field(() => SocialProvider)
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;
}

@ObjectType()
export class CustomerAuthPayload {
  @Field()
  accountId: string;

  @Field()
  customerId: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  token: string;

  @Field()
  refreshToken: string;
}
