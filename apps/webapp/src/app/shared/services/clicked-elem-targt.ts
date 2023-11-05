import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClickedElemTargetService {
  public currentClickedElemTarget!: MouseEvent;
  public currentClickedElemTargetRole!: string | null;
}
