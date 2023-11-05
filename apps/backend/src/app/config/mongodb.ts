import { registerAs } from '@nestjs/config';

export const MONGODB_CONFIG = registerAs('MONGODB_CONFIG', () => {
  return {
    url: process.env.MONGODB_URL,
  };
});
