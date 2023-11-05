export type directoryInfoType = {
  type?: string;
  id?: string | number;
  name: string;
  isDir?: boolean;
  isFile?: boolean;
  stats?: any;
  componentid?: string | number;
  newFileNameAfterCheckInServer?: string;
};
