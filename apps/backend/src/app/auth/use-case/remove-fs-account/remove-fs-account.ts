import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../../dtos/user.dto';
import * as fsExtra from 'fs-extra';
import path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RemoveFsAccountUseCase {
  constructor(private readonly _configService: ConfigService) {}
  async execute(user: Pick<CreateUserDto, 'email'>) {
    const { email } = user;
    // path.join(path.resolve(), 'apps', 'backend', 'accounts')
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');

    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    try {
      //remove if directory is not empty recursively
      fsExtra.removeSync(path.join(dest, email.split('@')[0]));
      return true;
    } catch (err) {
      return err;
    }
  }
}
