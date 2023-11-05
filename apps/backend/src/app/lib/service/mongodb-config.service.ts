import { Injectable } from '@nestjs/common';
import {
  MongooseModuleAsyncOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MongodbConfigService implements MongooseOptionsFactory {
  constructor(protected readonly _configService: ConfigService) {}

  createMongooseOptions(): MongooseModuleAsyncOptions {
    const options = {
      uri: this._configService.get('MONGODB_URL'),
    };

    return options as MongooseModuleAsyncOptions;
  }
}
