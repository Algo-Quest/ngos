import { DynamicModule, Global, Module } from "@nestjs/common";
import { MongooseModule, MongooseModuleAsyncOptions } from "@nestjs/mongoose";
import { MongodbConfigService } from "./service/mongodb-config.service";

type IMongooseModuleAsyncOptions<T extends keyof MongooseModuleAsyncOptions> = Pick<
  MongooseModuleAsyncOptions,
  T
> & {
  global: boolean;
};

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: MongodbConfigService,
    }),
  ],
})
export class MongoDatabaseModule {
  static registerAsync(
    options: IMongooseModuleAsyncOptions<"useClass" | "useFactory">
  ): DynamicModule {
    const moduleOptions = Object.assign({ global: true }, options);

    return {
      module: MongoDatabaseModule,
      global: moduleOptions.global,
      imports: [MongooseModule.forRootAsync(options)],
      exports: [MongooseModule],
    };
  }
}
