import { ElementRef, Injectable, ViewContainerRef } from '@angular/core';
import { commonDeskTopRightMenuSubject } from '../shared/subject/common-desktop-right-menu.subject';

@Injectable()
export class CreateFolderUseCase {
  constructor(private el: ElementRef) {}

  async execute(myDesktopRef: {
    mainDesktopRef: ViewContainerRef;
    baseDesktopRef: ViewContainerRef;
  }) {
    // console.log(myComponentRef.element.nativeElement);

    commonDeskTopRightMenuSubject.subscribe((target) => {
      console.log(target);
    });

    const folderRef = await import('../file-folder/folder/folder.component');

    let ref = myDesktopRef.baseDesktopRef.createComponent(
      folderRef.FolderComponent
    );
  }
}
