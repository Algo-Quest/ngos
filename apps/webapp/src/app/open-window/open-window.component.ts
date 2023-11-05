import {
  Component,
  ComponentRef,
  ElementRef,
  Input,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplyMoveDirective } from '../shared/directives/apply-move.directive';
import { terminalTaskList } from '../shared/services/task-ref';

@Component({
  selector: 'open-window',
  standalone: true,
  imports: [CommonModule, ApplyMoveDirective],
  providers: [],
  templateUrl: './open-window.component.html',
  styleUrls: ['./open-window.component.css'],
})
export class OpenWindowComponent {
  @ViewChild('windowBox') windowBox!: ElementRef;

  @Input() openWindowProjection!: Type<any>;
  @Input() myComponentId!: string | number;
  @Input() explorerComponentArrayRef: ComponentRef<HTMLElement>[] = [];

  @Input() appName!: string;

  @Input() myData!: any;

  @ViewChild('openWinProjectionRef', { read: ViewContainerRef })
  openWinProjectionRef!: ViewContainerRef;

  constructor() {}

  ngAfterViewInit() {
    //createCompoent openWidnow using ViewContainerRef and views -> drive component | terminal component
    let owref = this.openWinProjectionRef.createComponent(
      this.openWindowProjection
    ) as ComponentRef<any>;

    //Provide data to component (component-communication)
    owref.instance.myData = this.myData;
    //provide it to drive view the reference of main drive componentRef so, that in child we have ref of root drive compoent and we can create & clear the component
    owref.instance.openWinRootDriveViewRef = this.openWinProjectionRef;
    owref.instance.myComponentId = this.myComponentId;

    //
    let myComponentId = this.myComponentId;

    terminalTaskList.push({
      winRef: owref,
      componentId: myComponentId,
    });
    //
    //To solve : NG0100: ExpressionChangedAfterItHasBeenCheckedError; we iuse below changeDetection
    owref.changeDetectorRef.detectChanges();
  }

  public closeWindow(componentRefId: any) {
    //to delete compRef by closing window delete by index
    let index = terminalTaskList.findIndex(
      (cid) => cid.componentId == componentRefId
    );
    terminalTaskList.splice(index, 1);
    // console.log(componentRefId);

    let findXCompToDestroyIndex = this.explorerComponentArrayRef.findIndex(
      (x) => (x.instance as any).myComponentId == componentRefId
    );
    setTimeout(() => {
      //remove component by getting from array ref indexing

      this.explorerComponentArrayRef[findXCompToDestroyIndex].destroy();
      //
    }, 700);

    this.explorerComponentArrayRef[
      findXCompToDestroyIndex
    ].location.nativeElement.firstElementChild.classList.remove(
      'animate__jackInTheBox'
    );

    this.explorerComponentArrayRef[
      findXCompToDestroyIndex
    ].location.nativeElement.firstElementChild.classList.add(
      'animate__zoomOutDown'
    );
  }
}
