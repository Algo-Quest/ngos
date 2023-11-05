import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../../dtos/user.dto';
import { UserRepository } from '../../../repository/user';

@Injectable()
export class SignupUseCase {
  constructor(private readonly _userRepository: UserRepository) {}

  async execute(createUser: CreateUserDto) {
    const isUserExists = await this._userRepository.findOne({
      email: createUser.email,
    });

    if (isUserExists) return true;

    const result = await this._userRepository.insertOne(createUser);
    const finalResult = JSON.parse(JSON.stringify(result));

    delete finalResult.password;
    return finalResult;
  }
}
