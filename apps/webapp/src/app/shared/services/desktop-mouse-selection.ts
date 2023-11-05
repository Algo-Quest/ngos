import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DesktopMouseSelectionService {
  public isSelected: boolean = false;
  public movableObjects: HTMLElement[] = [];
}
