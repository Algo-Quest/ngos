import { Directive, ElementRef, Input } from '@angular/core';
import { MouseEventService } from '@ngos/helper';

/**
 * @Hint
 * Dierctive attaches inline style using js so, it hanldes for every attached directive
 */

@Directive({
  selector: '[applySelectHighLightRightMenu]',
  standalone: true,
})
export class ApplySelectHighLightRightMenuDirective {
  public desktopRightMenuRowProjection: any;
  public moreOptBox: any;
  public table: any;
  public myDesktopRef: any;

  @Input() set applySelectHighLightRightMenu(ev: any) {
    console.log(ev);
  }

  constructor(
    private el: ElementRef,
    private _mouseEventService: MouseEventService
  ) {}
}
