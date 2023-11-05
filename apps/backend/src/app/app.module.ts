import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketGateway } from './socket/socket';
import { AuthModule } from './auth/auth.module';
import { MongoDatabaseModule } from './lib/database-mongodb.module';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/config';
import { UserRepository } from './repository/user';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './model/user';
import { RemoteSession, RemoteSessionSchema } from './model/remote-session';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.prod'],
      load: [...configuration],
    }),
    AuthModule,
    MongoDatabaseModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RemoteSession.name, schema: RemoteSessionSchema },
    ]),
  ],
  controllers: [AppController],
  //never put jwtService in providers it will throw secretkey missing error
  providers: [AppService, WebsocketGateway, UserRepository],
})
export class AppModule {}
