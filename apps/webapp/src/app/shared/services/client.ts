import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  public clientId!: string;
  public clientConnectedInfo!: {
    session: string;
    dirPath: string;
    message: {
      myid: string;
      uid: string;
      reqEmail: string;
      receivingEmail: string;
    };
  };
}
