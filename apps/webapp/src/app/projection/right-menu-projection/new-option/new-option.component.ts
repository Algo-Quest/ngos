import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateFolderUseCase } from '../../../use-case/create-folder';
import { CreateFileUseCase } from '../../../use-case/create-file';
import { commonDeskTopRightMenuSubject } from '../../../shared/subject/common-desktop-right-menu.subject';

@Component({
  selector: 'ngos-new-option',
  standalone: true,
  imports: [CommonModule],
  providers: [CreateFolderUseCase, CreateFileUseCase],
  templateUrl: './new-option.component.html',
  styleUrls: ['./new-option.component.css'],
})
export class NewOptionComponent {
  @Input() myPosFromRigthMenuDesktop!: object | any;

  @ViewChild('table') table!: ElementRef;

  //It came from the component which created this component as that was provided through -> compRef.instance.myDesktopRef = this.myDesktopRef;
  @Input() myDesktopRef!: {
    mainDesktopRef: ViewContainerRef;
    baseDesktopRef: ViewContainerRef;
  };

  @Input() myMouseEvent!: MouseEvent;

  @Input() myTop!: number;

  constructor(
    private readonly _createFolderUseCase: CreateFolderUseCase,
    private readonly _createFileUseCase: CreateFileUseCase
  ) {}

  ngAfterViewInit(): void {
    // console.log(this.myDesktopRef);

    // const myPosFromRigthMenuDesktop =
    //   this.myPosFromRigthMenuDesktop.getBoundingClientRect();

    // let top = myPosFromRigthMenuDesktop.top;
    // let left = myPosFromRigthMenuDesktop.left;

    let top = this.myTop;

    //Here the top & left is taking position from curent hosted component
    Object.assign(this.table.nativeElement.style, {
      position: 'absolute',
      top: top + 'px',
      left: 295 + 'px',
    });
  }

  public createFolder() {
    let target = this.myMouseEvent.target as unknown as HTMLElement;

    let type = target.getAttribute('type');

    if (
      target.role == 'show-common-desktop-right-menu' &&
      type == 'directory'
    ) {
      commonDeskTopRightMenuSubject.next({
        target: this.myMouseEvent,
        type: 'folder',
      });
      return;
    }

    //it means clicked on specific row selected row option
    this._createFolderUseCase.execute(this.myDesktopRef);
  }

  public createFile() {
    let target = this.myMouseEvent.target as unknown as HTMLElement;

    let type = target.getAttribute('type');

    if (
      target.role == 'show-common-desktop-right-menu' &&
      type == 'directory'
    ) {
      commonDeskTopRightMenuSubject.next({
        target: this.myMouseEvent,
        type: 'file',
      });
      return;
    }

    this._createFileUseCase.execute(this.myDesktopRef);
  }
}
