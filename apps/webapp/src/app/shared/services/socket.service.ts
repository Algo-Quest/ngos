// websocket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  public socket!: Socket;

  constructor() {
    // { transports: ['websocket'] } otherwise error of CORS POLICY
    // this.socket = io(environment.socketServerBaseUrl, {
    //   transports: ['websocket'],
    // });
  }

  public connectToServer(ipAddress: string): Promise<any> {
    this.socket = io(ipAddress, {
      transports: ['websocket'],
    });

    //way to return from callback or connectToServer(ipAddress: string,callback){}
    return new Promise((resolve, reject) => {
      //if connected
      this.socket.on('connect', () => {
        resolve(true);
      });

      //if error stop reconnecting
      this.socket.on('connect_error', (error: Error) => {
        // ****** callback(error) ****
        if (this.socket) {
          // console.error('WebSocket connection failed:', error.message);
          this.socket.disconnect();
          reject(error);
        }
      });
    });
  }

  public async disconnectToServer(): Promise<boolean> {
    if (this.socket) {
      // console.error('WebSocket connection failed:', error.message);
      this.socket.disconnect();
      return true;
    }

    return false;
  }

  // Listen for a specific event
  onMessage(topic: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(topic, (data) => {
        observer.next(data);
      });
    });
  }
}
