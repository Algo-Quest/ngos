import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DockerPanelName } from './constants/docker-panel';
import { Type } from '../constants/constants';

@Component({
  selector: 'docker-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docker-panel.component.html',
  styleUrls: ['./docker-panel.component.css'],
})
export class DockerPanelComponent {
  public dockerPanelName = DockerPanelName;
  public type = Type;

  @Output() dockerAppOpenerEvent = new EventEmitter();

  constructor() {}

  public dockerAppOpener(
    type: string,
    appName: string,
    myElementRef: HTMLDivElement
  ) {
    let obj = {
      type,
      appName,
      myElementRef,
    };
    this.dockerAppOpenerEvent.emit(obj as any);
    // this._openWindowUseCase.execute();
  }

  ngAfterViewInit() {
    this.dockerHoverEFfect();
  }

  @ViewChild('dock', { read: ElementRef }) dock!: ElementRef;
  @ViewChildren('dockItem') dockItem!: QueryList<ElementRef>;

  public dockerHoverEFfect() {
    const dockRect = this.dock.nativeElement.getBoundingClientRect();
    this.dock.nativeElement.addEventListener('mousemove', (ev: MouseEvent) => {
      let mouseX = ev.clientX;
      let mouseY = ev.clientY;

      if (mouseX > dockRect.left || mouseY > dockRect.top) {
        this.dockItem.forEach((elem) => {
          let childDockRect = elem.nativeElement.getBoundingClientRect();

          if (
            Math.abs(mouseX - childDockRect.left) < 240 ||
            Math.abs(mouseX - childDockRect.right) < 240
          ) {
            Object.assign(elem.nativeElement.style, {
              width: 60 + mouseX / 40 + 'px',
              height: 60 + mouseX / 40 + 'px',
              transform: `translateY(-${
                mouseX / 50 - childDockRect.left / 240
              }px)`,
            });
            elem.nativeElement.firstChild.style.fontSize = '2vw';
          }

          if (mouseX > childDockRect.left && mouseX < childDockRect.right) {
            Object.assign(elem.nativeElement.style, {
              width: 120 + 'px',
              height: 120 + 'px',
              transform: `translateY(-${50}px)`,
            });

            elem.nativeElement.firstChild.style.fontSize = '4vw';
          } else {
            if (
              Math.abs(mouseX - childDockRect.left) < 10 ||
              Math.abs(mouseX - childDockRect.right) < 10
            ) {
              Object.assign(elem.nativeElement.style, {
                width: 120 + 'px',
                height: 120 + 'px',
                transform: `translateY(-${50}px)`,
              });

              elem.nativeElement.firstChild.style.fontSize = '2vw';
            }
          }

          if (
            Math.abs(mouseX - childDockRect.left) > 240 ||
            Math.abs(mouseX - childDockRect.right) > 240
          ) {
            Object.assign(elem.nativeElement.style, {
              width: 60 + 'px',
              height: 60 + 'px',
              transform: 'translateY(0px)',
            });
            elem.nativeElement.firstChild.style.fontSize = '2vw';
          }
        });
      }
    });

    this.dock.nativeElement.addEventListener('mouseleave', (ev: MouseEvent) => {
      this.dockItem.forEach((elem) => {
        Object.assign(elem.nativeElement.style, {
          width: 60 + 'px',
          height: 60 + 'px',
          transform: 'translateY(0px)',
        });

        elem.nativeElement.firstChild.style.fontSize = '2vw';
      });
    });
  }
}
