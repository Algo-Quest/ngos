import { Global, Module } from '@nestjs/common';
import { LoginController } from './use-case/login/login.controller';
import { SignupController } from './use-case/signup/signup.controller';
import { SignupUseCase } from './use-case/signup/signup.use-case';
import { UserRepository } from '../repository/user';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../model/user';
import { AuthService } from './services/auth.service';
import { RemoveFsAccountUseCase } from './use-case/remove-fs-account/remove-fs-account';
import { CreateFsAccountUseCase } from './use-case/create-fs-account/create-fs-account';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt-token';
import { LocalStrategy } from './strategy/local';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: 'jwt.is.strong',
      // signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [LoginController, SignupController],
  providers: [
    AuthService,
    SignupUseCase,
    UserRepository,
    RemoveFsAccountUseCase,
    CreateFsAccountUseCase,
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AuthModule {}
