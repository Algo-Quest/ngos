// websocket.service.ts
import { Injectable } from '@angular/core';
import { WebsocketService } from './socket.service';
import {
  getClientIdSubject,
  rootDirSubject,
} from '../subject/stored-session.subject';
import { RootDirService } from './root-dir';
import { ClientService } from './client';
import { grantAccessToRemoteSubject } from '../subject/remote-access.subject';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConnectClientService {
  public rootDir!: string;

  constructor(
    private websocketService: WebsocketService,
    public rootDirService: RootDirService,
    private readonly _clientService: ClientService
  ) {
    rootDirSubject.subscribe((rd) => {
      this.rootDir = rd as string;
    });
  }

  public connectToClient(ipAddress: string) {
    this.websocketService.socket.emit('connectToClient', {
      myid: this._clientService.clientId,
      uid: ipAddress,
      reqEmail: 'cl.aniketraj@gmail.com',
    });
    //

    grantAccessToRemoteSubject.pipe(take(1)).subscribe((grant) => {
      this.websocketService.socket.emit('accessGrantedForRemote');
    });
  }

  public getScid() {
    this.websocketService.socket.emit('getScid');
    let e = this.websocketService.onMessage('getScidRes').subscribe((data) => {
      getClientIdSubject.next(data);
    });
  }
}
