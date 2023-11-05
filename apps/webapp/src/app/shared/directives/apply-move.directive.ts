import { Directive, ElementRef } from '@angular/core';
import { MouseEventService } from '@ngos/helper';
import { Subject, map, of, switchMap, takeUntil } from 'rxjs';

/**
 * @Hint
 * Dierctive attaches inline style using js so, it hanldes for every attached directive
 */

@Directive({
  selector: '[applymove]',
  standalone: true,
})
export class ApplyMoveDirective {
  public zIndexCounter: number = 2;
  public activeMouseMove$ = new Subject();
  constructor(
    private el: ElementRef,
    private _mouseEventService: MouseEventService
  ) {}

  /**
   * Also Import this directive to the imports declaration otherwise it won't work
   * @Described Use position absolute fot the parent div and must have nested second div with directive then it will work only
   * <div class="position-absolute">
   *   <div  applymove></div>
   * </div>
   */
  ngOnInit() {
    let element = this.el?.nativeElement;
    let parentElement = element.parentElement;

    this._mouseEventService
      // provide element because on top-nav (child) click it gets active
      .getMouseStateOnElementDown(element)
      .pipe(
        switchMap((elemMd: any) => {
          //trick we access the parent element as above we gave (child) -> element in getMouseStateOnElementDown
          let oldClientX = elemMd.clientX - parentElement.offsetLeft;
          let oldClientY = elemMd.clientY - parentElement.offsetTop;
          return of({
            oldClientX,
            oldClientY,
          });
        }),
        map((oldEv: any) => {
          this._mouseEventService
            .getMouseStateOnMove()
            .pipe(takeUntil(this.activeMouseMove$))
            .subscribe((mouseMoveEv: any) => {
              parentElement.style.top =
                mouseMoveEv.clientY - oldEv.oldClientY + 'px';
              parentElement.style.left =
                mouseMoveEv.clientX - oldEv.oldClientX + 'px';
            });
        })
      )
      .subscribe();

    //mouse up remove mousedown observable event
    this._mouseEventService.getMouseStateOnUp().subscribe(() => {
      this.activeMouseMove$.next(false);
      //   this.activeMouseMove$.unsubscribe();
    });
    //

    //zindex increaser
    this._mouseEventService
      .getMouseStateOnElementClick(parentElement)
      .subscribe(() => {
        parentElement.style.zIndex = ++this.zIndexCounter;
      });
    this._mouseEventService
      .getMouseStateOnElementClick(element)
      .subscribe(() => {
        parentElement.style.zIndex = ++this.zIndexCounter;
      });
    //
  }
}
