import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplyMoveDirective } from '../../shared/directives/apply-move.directive';
import { fileSubject } from './file.subject';

@Component({
  selector: 'ngos-file',
  standalone: true,
  imports: [CommonModule, ApplyMoveDirective],
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.css'],
})
export class FileComponent {
  constructor() {}

  public fileId: number = new Date().getMilliseconds() + Math.random();

  ngAfterViewInit(): void {
    fileSubject.next('folder_created');
  }
}
