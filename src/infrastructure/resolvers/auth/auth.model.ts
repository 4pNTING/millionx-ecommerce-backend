import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { ActiveStatus } from '../../../domain/enums/enum';

@InputType()
export class LoginInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  username: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

@ObjectType()
export class LoginPayload {
  @Field({ nullable: true })
  _id?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  role?: string;

  @Field(() => String, { nullable: true })
  isActive?: ActiveStatus;

  @Field({ nullable: true })
  token?: string;

  @Field({ nullable: true })
  refreshToken?: string;
}
