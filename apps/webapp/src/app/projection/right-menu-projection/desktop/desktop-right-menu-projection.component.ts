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
import { ApplySelectHighLightRightMenuDirective } from '../../../shared/directives/select-highlight-right-meunu.directive';

@Component({
  selector: 'ngos-desktop-right-menu-projection',
  standalone: true,
  imports: [CommonModule, ApplySelectHighLightRightMenuDirective],
  templateUrl: './desktop-right-menu-projection.component.html',
  styleUrls: ['./desktop-right-menu-projection.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeskTopRightMenuProjectionComponent {
  @ViewChild('moreOptBox', { read: ViewContainerRef })
  moreOptBox!: ViewContainerRef;

  @ViewChild('table') table!: ElementRef;

  constructor(private readonly _cdr: ChangeDetectorRef) {}

  @ViewChildren('desktopRightMenuRowProjection')
  desktopRightMenuRowProjection!: QueryList<ElementRef>;

  //get from key names from ngComponentOutlet context
  @Input() myData: any;
  //its a homescreen ref came from child references of components
  @Input() myDesktopRef: any;

  @Input() myMouseEvent!: MouseEvent;

  ngAfterViewInit(): void {
    // console.log(this.myDesktopRef);
    this.desktopRightMenuRowProjection.forEach((elem: ElementRef) => {
      this.elemClickHandler(elem);
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
        //Put in usecase these monologic codes
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
          //pass to created component the template/componentRef/Msg etc
          ref.instance.myDesktopRef = this.myDesktopRef;

          ref.instance.myTop = 85;

          ref.instance.myMouseEvent = this.myMouseEvent;

          ref.changeDetectorRef.detectChanges();
        }

        //Put in usecase these monologic codes
        if (doesHaveMoreOpt && optType == 'view') {
          //make active the selected row with blue color backgrondColor on/off
          if (this.checkOpenedOrNotByClick.contains('active')) {
            //clear componenet from like remove child from the host component
            this.moreOptBox.clear();
            this.checkOpenedOrNotByClick.toggle('active');
            return;
          }
          this.checkOpenedOrNotByClick.toggle('active');
          //

          const newOptComp = await import(
            '../view-option/view-option.component'
          );
          let ref = this.moreOptBox.createComponent(
            newOptComp.ViewOptionComponent
          ) as ComponentRef<any>;

          ///if needed to provide msg/template in created component
          // ref.instance.myMsg = "created"
          ref.instance.myPosFromRigthMenuDesktop = this.table.nativeElement;
          //pass to created component the template/componentRef/Msg etc
          ref.instance.myDesktopRef = this.myDesktopRef;

          ref.instance.myTop = 0;

          ref.instance.myMouseEvent = this.myMouseEvent;

          ref.changeDetectorRef.detectChanges();
        }
      }
    });
  }
}
