// websocket.service.ts
import { Injectable } from '@angular/core';
import { WebsocketService } from './socket.service';
import {
  cdSubject,
  lsSubject,
  mkdirSubject,
  rmdirForceSubject,
  rmdirSubject,
  rootDirSubject,
} from '../subject/stored-session.subject';
import { Subscription } from 'rxjs';
import { RootDirService } from './root-dir';

@Injectable({
  providedIn: 'root',
})
export class DirectoryCrudService {
  public rootDir!: string;

  constructor(
    private websocketService: WebsocketService,
    public rootDirService: RootDirService
  ) {
    rootDirSubject.subscribe((rd) => {
      this.rootDir = rd as string;
    });
  }

  public ls(email: string) {
    this.websocketService.socket.emit('ls', {
      dirPath: this.rootDirService.rootDir,
      email,
    });

    let subscription: Subscription = this.websocketService
      .onMessage('lsRes')
      .subscribe((data) => {
        lsSubject.next(data);
        //prevents multiple socket.on emisson
        subscription.unsubscribe();
      });
  }

  public cd(email: string, cd: string) {
    this.websocketService.socket.emit('cd', {
      dirPath: this.rootDirService.rootDir,
      cd: cd,
      email: email,
    });

    let subscription: Subscription = this.websocketService
      .onMessage('cdRes')
      .subscribe((data) => {
        cdSubject.next(data);
        //prevents multiple socket.on emisson
        subscription.unsubscribe();
      });
  }

  public mkdir(email: string, mkdirName: string) {
    this.websocketService.socket.emit('mkdir', {
      dirPath: this.rootDirService.rootDir,
      mkdirName: mkdirName,
      email: email,
    });

    let subscription: Subscription = this.websocketService
      .onMessage('mkdirRes')
      .subscribe((data) => {
        mkdirSubject.next(data);
        //prevents multiple socket.on emisson
        subscription.unsubscribe();
      });
  }

  public rmdir(email: string, rmdirName: string) {
    this.websocketService.socket.emit('rmdir', {
      dirPath: this.rootDirService.rootDir,
      rmdirName: rmdirName,
      email: email,
    });

    let subscription: Subscription = this.websocketService
      .onMessage('rmdirRes')
      .subscribe((data) => {
        rmdirSubject.next(data);
        //prevents multiple socket.on emisson
        subscription.unsubscribe();
      });
  }

  public rmdirForce(email: string, rmdirName: string) {
    this.websocketService.socket.emit('rmdirForce', {
      dirPath: this.rootDirService.rootDir,
      rmdirName: rmdirName,
      email: email,
    });

    let subscription: Subscription = this.websocketService
      .onMessage('rmdirForceRes')
      .subscribe((data) => {
        rmdirForceSubject.next(data);
        //prevents multiple socket.on emisson
        subscription.unsubscribe();
      });
  }

  public copydir() {}

  public mkfile() {}

  public rmfile() {}
}
