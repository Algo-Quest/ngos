import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../../dtos/user.dto';
import fs from 'fs';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import { driveConfig } from '../../../config/default.drives';

@Injectable()
export class CreateFsAccountUseCase {
  constructor(private readonly _configService: ConfigService) {}

  async execute(user: Pick<CreateUserDto, 'email'>) {
    const { email } = user;
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    try {
      fs.mkdirSync(path.join(dest, email.split('@')[0]));

      fs.mkdirSync(path.join(dest, email.split('@')[0], 'DRIVE'));

      //create default drives should be visible on drive window open
      driveConfig.availableDrives.forEach((drive) => {
        fs.mkdirSync(
          path.join(dest, email.split('@')[0], 'DRIVE', drive.driveName)
        );
      });

      return true;
    } catch (err) {
      return err;
    }
  }
}
