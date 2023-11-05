import { Injectable, ViewContainerRef } from '@angular/core';

@Injectable()
export class CreateFileUseCase {
  constructor() {}

  async execute(myDesktopRef: {
    mainDesktopRef: ViewContainerRef;
    baseDesktopRef: ViewContainerRef;
  }) {
    const fileComp = await import('../file-folder/file/file.component');

    let ref = myDesktopRef.baseDesktopRef.createComponent(
      fileComp.FileComponent
    );
  }
}
