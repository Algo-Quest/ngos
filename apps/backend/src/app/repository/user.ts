import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../lib/repository/base.repository';
import { User } from '../model/user';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectModel(User.name) public readonly userModel: Model<User>) {
    super(userModel);
  }

  public async isUserExist(email: string) {
    let result = await this.userModel.findOne({ email });
    return result;
  }
}
