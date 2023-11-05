import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { rightMenuRowSelectorHighlight } from '../shared/subject/right-menu-row-selector-highlight';
import { commonDeskTopRightMenuSubject } from '../shared/subject/common-desktop-right-menu.subject';

@Injectable()
export class OpenCustomRightClickMenuUseCase {
  constructor() {}

  async execute(
    mouseEvent: Document,
    DesktopRef: {
      mainDesktopRef: ViewContainerRef;
      baseDesktopRef: ViewContainerRef;
    }
  ) {
    let rightMenuComp = await import('../right-menu/right-menu.component');
    //import on top other wise it takes time so, forst time msg/template may not go first time because it will be importing file so delayed
    let myRightMenuProjectionComp: any;
    const target = (mouseEvent as unknown as MouseEvent).target as HTMLElement;
    if (
      target.role == null ||
      target.role == 'show-common-desktop-right-menu'
    ) {
      myRightMenuProjectionComp = await import(
        '../projection/right-menu-projection/desktop/desktop-right-menu-projection.component'
      );
    } else if (target.role == 'directory-right-menu-column') {
      rightMenuRowSelectorHighlight.next(target);

      myRightMenuProjectionComp = await import(
        '../projection/right-menu-projection/directory/directory-right-projection.component'
      );
    }

    if (!myRightMenuProjectionComp) return;

    //clear view before creating
    DesktopRef.mainDesktopRef.clear();

    let ref = DesktopRef.mainDesktopRef.createComponent(
      rightMenuComp.RightMenuComponent
    ) as ComponentRef<any>;

    //provide template or msg
    ref.instance.myMouseEvent = mouseEvent;
    //provide template it will go in @Input() myDestopRightMenuTemplate in receiving component
    ref.instance.myDestopRightMenuTemplate =
      myRightMenuProjectionComp?.DeskTopRightMenuProjectionComponent ||
      myRightMenuProjectionComp?.DirectoryRightMenuProjectionComponent;

    //provide mainDesktopRef homescreen ref
    ref.instance.myDesktopRef = DesktopRef;
  }
}
