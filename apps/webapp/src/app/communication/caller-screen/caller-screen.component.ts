import { Component, ComponentRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplyMoveDirective } from '../../shared/directives/apply-move.directive';
import { callerScreenCreatedSubject } from '../../shared/subject/ngShareCreateAnswer';

@Component({
  selector: 'ngos-receiver-screen',
  standalone: true,
  imports: [CommonModule, ApplyMoveDirective],
  templateUrl: './caller-screen.component.html',
  styleUrls: ['./caller-screen.component.css'],
})
export class CallerScreenComponent {
  constructor() {}

  ngAfterViewInit() {
    callerScreenCreatedSubject.next(true);
  }

  public denyCallReq() {}
}
