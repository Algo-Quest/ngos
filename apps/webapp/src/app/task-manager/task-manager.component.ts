import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngos-task-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.css'],
})
export class TaskManagerComponent {
  @ViewChild('taskmgr') taskmgr!: ElementRef;

  @Input() myElementRef!: HTMLDivElement;

  constructor() {}

  ngAfterViewInit(): void {
    const appIconOfTaskMgrPosOnScreen =
      this.myElementRef?.getBoundingClientRect();

    let taskMgrPos = this.taskmgr.nativeElement.getBoundingClientRect();

    Object.assign(this.taskmgr.nativeElement.style, {
      position: 'absolute',
      top: appIconOfTaskMgrPosOnScreen.top - taskMgrPos.height - 100 + 'px',
      left:
        appIconOfTaskMgrPosOnScreen.left +
        appIconOfTaskMgrPosOnScreen.left / 3.5 +
        'px',
      zIndex: 99999999999999,
    });
  }
}
