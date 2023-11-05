import { registerAs } from '@nestjs/config';

export interface IBcryptConfigOptions {
  salt_rounds: number;
}

export const bcryptConfig: IBcryptConfigOptions = {
  salt_rounds: +process.env.BCRYPT_SALT_ROUNDS,
};

export const BCRYPT_CONFIG = registerAs('BCRYPT_CONFIG', () => {
  return bcryptConfig as IBcryptConfigOptions;
});
