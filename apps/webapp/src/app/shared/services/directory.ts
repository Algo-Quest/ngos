import { Injectable } from '@angular/core';
import { directoryInfoType } from '../../types/directory-info';

@Injectable({
  providedIn: 'root',
})
export class DirectoryService {
  public directoryInfo!: object;
}
