import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplyMoveDirective } from '../../shared/directives/apply-move.directive';
import { folderSubject } from './folder.subject';

@Component({
  selector: 'ngos-folder',
  standalone: true,
  imports: [CommonModule, ApplyMoveDirective],
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.css'],
})
export class FolderComponent {
  public folderId: number = new Date().getMilliseconds() + Math.random();
  constructor() {}

  ngAfterViewInit(): void {
    folderSubject.next('folder_created');
  }
}
