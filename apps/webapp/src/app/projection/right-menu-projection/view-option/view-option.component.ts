import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { viewModeSubject } from '../../../shared/subject/view-mode.subject';

@Component({
  selector: 'ngos-view-option',
  standalone: true,
  imports: [CommonModule],
  providers: [],
  templateUrl: './view-option.component.html',
  styleUrls: ['./view-option.component.css'],
})
export class ViewOptionComponent {
  @Input() myPosFromRigthMenuDesktop!: object | any;

  @ViewChild('table') table!: ElementRef;

  //It came from the component which created this component as that was provided through -> compRef.instance.myDesktopRef = this.myDesktopRef;
  @Input() myDesktopRef!: {
    mainDesktopRef: ViewContainerRef;
    baseDesktopRef: ViewContainerRef;
  };

  @Input() myMouseEvent!: MouseEvent;

  @Input() myTop!: number;

  constructor() {}

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

  public viewTiles() {
    const myMouseEvent = this.myMouseEvent;
    viewModeSubject.next({ viewMode: 'tiles', event: myMouseEvent });
  }

  public viewList() {
    const myMouseEvent = this.myMouseEvent;
    viewModeSubject.next({ viewMode: 'list', event: myMouseEvent });
  }
}
