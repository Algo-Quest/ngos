import {
  Component,
  ComponentRef,
  ElementRef,
  Injector,
  Input,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngos-right-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './right-menu.component.html',
  styleUrls: ['./right-menu.component.css'],
})
export class RightMenuComponent {
  @ViewChild('rightMenu') rightMenu!: ElementRef;
  @Input() myMouseEvent!: MouseEvent;

  //receiving component from instance in input communication
  @Input()
  myDestopRightMenuTemplate!: Type<any>;

  @Input() myDesktopRef!: ComponentRef<any>;

  myInjector!: Injector;

  //used for  projectable content from the templates like ng-content
  myContent?: any[][];

  constructor(private parentInjector: Injector, private vcr: ViewContainerRef) {
    /*
    right now we do not have work for service if needed then enable and provide services in providers
    */
    //
    // this.myInjector = Injector.create({
    //   providers: [
    //     {
    //       //provide services in which the dynamic created component is dependent
    //       provide:  GreeterService
    //       deps: [
    //         /*HttpClient, MyOtherService*/
    //       ],
    //     },
    //   ],
    //   //this is optional
    //   parent: this.parentInjector,
    // });
  }

  ngOnInit() {
    // Create the projectable content from the templates like ng-content
    //just provide in provided html template like <ng-content></ng-content>
    // this.myContent = [
    //   this.vcr.createEmbeddedView(this.ahojTemplateRef).rootNodes,
    // ];
  }

  //here dyanmic rows wet property like border color for rows
  ngAfterViewInit() {
    let topY = this.myMouseEvent.clientY + 'px',
      leftX = this.myMouseEvent.clientX + 'px';

    Object.assign(this.rightMenu.nativeElement.style, {
      top: topY,
      left: leftX,
      zIndex: 999999999999999,
    });
  }
}
