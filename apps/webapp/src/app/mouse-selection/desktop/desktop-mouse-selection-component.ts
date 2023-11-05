import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesktopMouseSelectionService } from '../../shared/services/desktop-mouse-selection';
import { windowRef } from '../../shared/services/window-ref';

@Component({
  selector: 'ngos-desktop-mouse-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './desktop-mouse-selection.html',
  styleUrls: ['./desktop-mouse-selection.css'],
})
export class DesktopMouseSelectionComponent {
  @Input() myTop!: number;
  @Input() myLeft!: number;

  @Input() mdmyTop!: number;

  @Input() mdmyLeft!: number;

  @Input() mouseMoveElements!: MouseEvent;

  @ViewChild('boxTobe', { read: ElementRef }) boxTobe!: ElementRef;

  constructor(
    private _desktopMouseSelectionService: DesktopMouseSelectionService
  ) {}

  public movableObjects = [] as any;

  ngAfterViewInit() {}

  ngDoCheck(): void {
    //working on mouse move entire component on ng-do-check logic
    if (!this.myTop || !this.myLeft) return;

    // console.log(this.myLeft, this.mdmyLeft);

    this.boxTobe.nativeElement.style.top =
      this.myTop - (this.myTop - this.mdmyTop) + 'px';
    this.boxTobe.nativeElement.style.left =
      this.myLeft - (this.myLeft - this.mdmyLeft) + 'px';

    this.boxTobe.nativeElement.style.height = this.myTop - this.mdmyTop + 'px';
    this.boxTobe.nativeElement.style.width = this.myLeft - this.mdmyLeft + 'px';

    //for left above reverse side
    if (this.myLeft < this.mdmyLeft) {
      let distMove = Math.abs(this.mdmyLeft - this.myLeft);
      this.boxTobe.nativeElement.style.left = this.mdmyLeft - distMove + 'px';
      this.boxTobe.nativeElement.style.width = distMove + 'px';
    }

    //for top above reverse side
    if (this.myTop < this.mdmyTop) {
      let distMove = Math.abs(this.mdmyTop - this.myTop);
      this.boxTobe.nativeElement.style.top = this.mdmyTop - distMove + 'px';
      this.boxTobe.nativeElement.style.height = distMove + 'px';
    }

    //
    // no relation with above logic
    //
    // this.mdmyLeft -> md means mouse down

    let msd = Array.from(
      document.querySelectorAll('[mouseselection="true"]')
    ) as HTMLElement[];

    let calPos = msd.map((elem) => elem.getBoundingClientRect());

    this._desktopMouseSelectionService.isSelected = true;

    calPos.forEach((elemX, index) => {
      // for  down to up direction selection
      if (
        elemX.x <= this.mdmyLeft &&
        this.myLeft <= elemX.x &&
        elemX.y <= this.mdmyTop &&
        this.myTop <= elemX.y + 75
      ) {
        msd[index].style.background = 'red';

        let r = this.movableObjects.find((r: any) => r.id == msd[index].id);
        if (r) return;

        this.movableObjects.push(msd[index]);
      }

      // for down to up direction selection but select from left to right
      if (
        elemX.x + 75 >= this.mdmyLeft &&
        this.myLeft >= elemX.x &&
        elemX.y + 75 >= this.mdmyTop &&
        this.myTop >= elemX.y
      ) {
        msd[index].style.background = 'red';

        let r = this.movableObjects.find((r: any) => r.id == msd[index].id);
        if (r) return;
        this.movableObjects.push(msd[index]);
      }

      // for up to down direction selection

      if (
        elemX.x <= this.mdmyLeft &&
        this.myLeft <= elemX.x &&
        elemX.y >= this.mdmyTop &&
        this.myTop >= elemX.y - 75
      ) {
        msd[index].style.background = 'red';
        let r = this.movableObjects.find((r: any) => r.id == msd[index].id);
        if (r) return;
        this.movableObjects.push(msd[index]);
      }
    });
  }
}
