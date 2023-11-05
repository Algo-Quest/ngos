import { Injectable } from '@angular/core';

@Injectable()
export class PreventContextMenuUseCase {
  constructor() {}

  execute(document: Document) {
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault(); // Prevent the default context menu
    });
  }
}
