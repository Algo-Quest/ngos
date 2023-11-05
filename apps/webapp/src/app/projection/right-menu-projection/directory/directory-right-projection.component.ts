import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  ElementRef,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { viewModeSubject } from '../../../shared/subject/view-mode.subject';

@Component({
  selector: 'ngos-directory-right-menu-projection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directory-right-projection.component.html',
  styleUrls: ['./directory-right-projection.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectoryRightMenuProjectionComponent {
  @ViewChild('moreOptBox', { read: ViewContainerRef })
  moreOptBox!: ViewContainerRef;

  @ViewChild('table') table!: ElementRef;

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  @ViewChildren('directoryRightMenuRowProjection')
  directoryRightMenuRowProjection!: QueryList<ElementRef>;

  //get from key names from ngComponentOutlet context
  @Input() myData: any;
  //its a homescreen ref came from child references of components
  @Input() myDesktopRef: any;

  @Input() myMouseEvent!: MouseEvent;

  ngAfterViewInit(): void {
    // console.log(this.myDesktopRef);
    this.directoryRightMenuRowProjection.forEach((elem: ElementRef) => {
      this.elemClickHandler(elem);
    });

    viewModeSubject.subscribe((ev) => {
      console.log(ev);
    });
  }

  public checkOpenedOrNotByClick: any;

  public elemClickHandler(elem: ElementRef) {
    elem.nativeElement.addEventListener('click', async (e: HTMLElement) => {
      //if clicked other elements destroy the component and remove active for prev selected element
      if (this.checkOpenedOrNotByClick) {
        this.moreOptBox.clear();
        this.checkOpenedOrNotByClick.toggle('active');
        //also make it null so, again the click logic works
        this.checkOpenedOrNotByClick = null;
        return;
      }

      this.checkOpenedOrNotByClick = elem.nativeElement.classList;

      const [role, doesHaveMoreOpt, optType] = elem.nativeElement.role?.split(
        ' '
      ) as string[];

      if (role) {
        if (doesHaveMoreOpt && optType == 'new') {
          //make active the selected row with blue color backgrondColor on/off
          if (this.checkOpenedOrNotByClick.contains('active')) {
            //clear componenet from like remove child from the host component
            this.moreOptBox.clear();
            this.checkOpenedOrNotByClick.toggle('active');
            return;
          }
          this.checkOpenedOrNotByClick.toggle('active');
          //

          const newOptComp = await import('../new-option/new-option.component');
          let ref = this.moreOptBox.createComponent(
            newOptComp.NewOptionComponent
          ) as ComponentRef<any>;

          ///if needed to provide msg/template in created component
          // ref.instance.myMsg = "created"
          ref.instance.myPosFromRigthMenuDesktop = this.table.nativeElement;
          ref.instance.myTop = 343;
          //pass to created component the template/componentRef/Msg etc
          ref.instance.myDesktopRef = this.myDesktopRef;

          ref.changeDetectorRef.detectChanges();
        }
      }
    });
  }
}
