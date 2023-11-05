import { registerAs } from '@nestjs/config';

export const FS_PATH_CONFIG = registerAs('FS_PATH_CONFIG', () => {
  return {
    fs_path: process.env.FS_PATH,
  };
});
