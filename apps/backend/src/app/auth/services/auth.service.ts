import {
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../../repository/user';
import { BcryptUtility } from '../../utils/bcrypt.utils';
import { IAuthValidateUser } from '../types/auth';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly _userRepo: UserRepository) {}

  public async validateUser(
    email: string,
    password: string
  ): Promise<IAuthValidateUser> {
    const user = await this._userRepo.findOne({ email });

    if (!user) {
      throw new NotAcceptableException('could not find the user');
    }

    const passwordValid = await BcryptUtility.compare(password, user.password);

    if (user && passwordValid) {
      return {
        userId: user.id,
      };
    }

    throw new UnauthorizedException('unauthorized access');
  }

  public async validateUserById(userId: string): Promise<IAuthValidateUser> {
    const user = await this._userRepo.findOne({ _id: userId });

    if (!user) {
      throw new NotAcceptableException('could not find the user');
    }

    if (user) {
      return {
        userId: user.id,
      };
    }

    throw new UnauthorizedException('unauthorized access');
  }
}
