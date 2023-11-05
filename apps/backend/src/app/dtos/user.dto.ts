import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { createUserMinPasswordLength } from '../constants/create-user-min-password';

export abstract class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  readonly firstName: string;

  @IsNotEmpty()
  @IsString()
  readonly lastName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(createUserMinPasswordLength)
  password: string;
}
