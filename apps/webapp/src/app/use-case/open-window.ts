import { Injectable, ViewContainerRef } from '@angular/core';
import { OpenWindowComponent } from '../open-window/open-window.component';

@Injectable()
export class OpenWindowUseCase {
  constructor(private _vcr: ViewContainerRef) {}

  execute() {
    this._vcr.clear();
    this._vcr.createComponent(OpenWindowComponent);
  }
}
