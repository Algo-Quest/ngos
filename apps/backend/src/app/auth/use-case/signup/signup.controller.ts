import {
  Body,
  ConflictException,
  Controller,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateUserDto } from '../../../dtos/user.dto';
import { SignupUseCase } from './signup.use-case';
import { CreateFsAccountUseCase } from '../create-fs-account/create-fs-account';
import { RemoveFsAccountUseCase } from '../remove-fs-account/remove-fs-account';

@Controller('signup')
export class SignupController {
  constructor(
    private readonly _signupUseCase: SignupUseCase,
    private readonly _createFsAccountUseCase: CreateFsAccountUseCase,
    private readonly _removeFsAccountUseCase: RemoveFsAccountUseCase
  ) {}

  @Post()
  public async signUp(@Body() createUser: CreateUserDto) {
    const result = await this._signupUseCase.execute(createUser);

    switch (result) {
      case true:
        throw new ConflictException({
          msg: 'user exists already!',
          isUserCreated: false,
        });
    }

    if (result) {
      try {
        await this._removeFsAccountUseCase.execute(result);
        await this._createFsAccountUseCase.execute(result);
        return {
          msg: 'user created successfully!',
          data: result,
        };
      } catch {
        throw new ServiceUnavailableException();
      }
    }

    throw new ServiceUnavailableException();
  }
}
