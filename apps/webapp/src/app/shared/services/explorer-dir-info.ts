import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExplorerDirInfoService {
  //example usecase :
  // {
  // exploerrId : "_exploer1".
  // exploerrId : "_exploer2"
  // }
  public explorerDirInfoMap = {} as {
    [key: string | number]: any;
  };
}
