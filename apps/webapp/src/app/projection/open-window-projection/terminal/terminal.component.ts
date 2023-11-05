import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../../shared/services/socket.service';
import { environment } from 'apps/webapp/src/environments/environment';
import { DirectoryCrudService } from '../../../shared/services/directory-crud';
import {
  cdSubject,
  getClientIdSubject,
  lsSubject,
  mkdirSubject,
  rmdirForceSubject,
  rmdirSubject,
  rootDirSubject,
} from '../../../shared/subject/stored-session.subject';
import { Subscription, of, switchMap, take } from 'rxjs';
import { RootDirService } from '../../../shared/services/root-dir';
import { ConnectClientService } from '../../../shared/services/connect-client';
import { grantAccessToRemoteSubject } from '../../../shared/subject/remote-access.subject';
import { ClientService } from '../../../shared/services/client';
import { terminalTaskList } from '../../../shared/services/task-ref';
import { myInfo } from '../../../shared/services/my-info';

@Component({
  selector: 'ngos-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css'],
})
export class TerminalComponent {
  @Input() myComponentId!: string | number;

  @ViewChild('terminal', { read: ElementRef }) terminal!: ElementRef;
  @ViewChild('terminalInput') terminalInput!: ElementRef;
  @ViewChild('output') output!: ElementRef;
  @ViewChild('cmdPrintArea') cmdPrintArea!: ElementRef;

  constructor(
    private websocketService: WebsocketService,
    private readonly _directoryCrudService: DirectoryCrudService,
    public rootDirService: RootDirService,
    public connectClientService: ConnectClientService,
    private _clientService: ClientService,
    private _wsMouseKeyboardServer: WebsocketService
  ) {
    this.handleGrantAccessToRemoteSubject();
  }

  public handleGrantAccessToRemoteSubject() {
    grantAccessToRemoteSubject.pipe(take(1)).subscribe((resp) => {
      this.websocketService.socket.emit('createRemoteAccessSession', resp);
    });

    this.websocketService
      .onMessage('createRemoteAccessSessionRes')
      .pipe(take(1))
      .subscribe((res) => {
        // console.log(res);
        // console.log(this._clientService.clientId);
        this._clientService.clientConnectedInfo = res;
        let trgtComp = terminalTaskList[terminalTaskList.length - 1];

        // .find(
        //   (comp) => comp.componentId == this.myComponentId
        // );

        if (trgtComp?.componentId == this.myComponentId) {
          (
            trgtComp as any
          ).winRef.instance.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>sesssion id -> ${res.message.myid} - ${res.message.uid} created!</p>`;
          (
            trgtComp as any
          ).winRef.instance.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>user email -> ${res.message.reqEmail} - ${res.message.receivingEmail} connected!</p>`;
          (
            trgtComp as any
          ).winRef.instance.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>active sesssion token : ${res.session}</p>`;
        } else if (!trgtComp?.componentId) {
          //if auto new terminal does not open in sender window terminal
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>sesssion id -> ${res.message.myid} - ${res.message.uid} created!</p>`;
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>user email -> ${res.message.reqEmail} - ${res.message.receivingEmail} connected!</p>`;
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>active sesssion token : ${res.session}</p>`;
        }
      });
  }

  async ngAfterViewInit() {
    //as the socket connection made on app.component.ts  -> on app start
    this.loadRootDirOnTerminal();
    //
    this.terminal.nativeElement.addEventListener('click', () => {
      this.terminalInput.nativeElement.focus();
    });
  }

  public async handleInput(event: any) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default Enter behavior (submitting a form)
      const inputElement = event.target;
      const inputValue = inputElement.value;
      this.cmdPrintArea.nativeElement.innerHTML += `<p>${this.rootDirService.rootDir} >  ${inputValue}</p>`;
      inputElement.value = 'please wait...';
      await this.inputValueArgsDecider(inputValue);
      // Clear the input field
      inputElement.value = '';
      // Process the input (for demonstration, just adding a new line to the output)
    }
  }

  public async inputValueArgsDecider(inputValue: string) {
    let a = inputValue.split(' ');

    if (a[0] == 'ls') {
      this.handleLs();
    } else if (a[0] == 'su' && a[1] == 'ls') {
      this.handleSuLs();
    } else if (a[0] == 'su' && a[1] == 'mkdir' && a[2] != '') {
      this.handleSuMkdir(a[2]);
    } else if (a[0] == 'cd' && a[1] != '') {
      this.handleCd(a[1]);
    } else if (a[0] == 'mkdir' && a[1] != '') {
      this.handleMkdir(a[1]);
    } else if (a[0] == 'rmdir' && a[1] != '' && a[2] == '-f') {
      this.handleRmdirForce(a[1]);
    } else if (a[0] == 'rmdir' && a[1] != '' && !a[2]) {
      this.handleRmdir(a[1]);
    } else if (a[0] == 'connect' && a[1] != '') {
      await this.connectToClient(a[1]);
    } else if (a[0] == 'get' && a[1] == 'scid') {
      await this.getScid();
    } else if (a[0] == 'disconnect') {
      await this.disconnectToClient();
    } else if (a[0] == 'cls') {
      await this.clsScreen();
    } else if (a[0] == 'r') {
      await this.remoteAccessTrue();
      // await this.remoteAccessForMouseAndKeyboard();
    } else if (a[0] == 'creator') {
      this.cmdPrintArea.nativeElement.innerHTML += `<p class="text-warning">
      I have been created by <u>Aniket Raj</u>.
      </p>`;

      this.cmdPrintArea.nativeElement.innerHTML += `<p class="text-warning">
      Want to know more about him please visit link at : <a class="text-light" href="https://stackoverflow.com/users/20493210/jerry?tab=profile">https://stackoverflow.com/users/20493210/jerry?tab=profile</a>
      </p>`;

      this.cmdPrintArea.nativeElement.innerHTML += `<p class="text-primary">
      Made with <i class="bi bi-heart-fill text-danger"></i> in leisure time
      </p>`;
    }
  }

  public async remoteAccessTrue() {
    // this._wsMouseKeyboardServer.connectToServer('http://localhost:3001');
    //
    let cc = this._clientService.clientConnectedInfo;
    this.websocketService.socket.emit('remoteAccessTrue', cc);
  }

  public handleSuMkdir(mkdirName: string) {
    let clientConnectedInfo = this._clientService.clientConnectedInfo;

    this.websocketService.socket.emit(
      'suMkdir',
      Object.assign(
        {
          dirPath: this.rootDirService.rootDir,
          mkdirName: mkdirName,
          email: clientConnectedInfo.message.receivingEmail,
        },
        clientConnectedInfo
      )
    );

    let subscription: Subscription = this.websocketService
      .onMessage('suMkdirRes')
      .subscribe((data) => {
        mkdirSubject.next(data);
        //prevents multiple socket.on emisson
        subscription.unsubscribe();
      });

    let s: Subscription = mkdirSubject
      //take(1) used to emit the latest event skiping the older events
      .pipe(take(1))
      .subscribe((data) => {
        if (!data) {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>SU :: Directory '${mkdirName}' created!</p>`;
          return;
        } else {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-danger'>${data}</p>`;
        }

        //not to be called multiple times rxjs
        s.unsubscribe();
      });
  }

  public handleSuLs() {
    let clientConnectedInfo = this._clientService.clientConnectedInfo;

    Object.assign(clientConnectedInfo, {
      dirPath: this.rootDirService.rootDir,
    });

    this.websocketService.socket.emit('suLs', clientConnectedInfo);

    this.websocketService
      .onMessage('suLsRes')
      .pipe(take(1))
      .subscribe((dirs) => {
        this.cmdPrintArea.nativeElement.innerHTML += `<p class="text-danger">
        Directory of session user (SU) : ${this.rootDirService.rootDir}
        </p>
        `;

        if (dirs.length < 1) {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class="text-warning">Empty directory</p>`;
        } else
          dirs.forEach((element: any) => {
            this.cmdPrintArea.nativeElement.innerHTML += `
          <div class="directory-listing">
            <div class="directory">
              <div class="directory-details">
                <span class="text-white">${new Date(
                  element.stats.birthtime
                ).toLocaleString()}</span>
                <span class="text-warning">&lt;${
                  element.isDir ? 'DIR' : 'FILE'
                }&gt;</span>
                <span class="directory-name text-primary mx-4 px-4">${
                  element.name
                }</span>
              </div>
            </div>
          </div>
          <p></p>
          `;
          });
      });
  }

  public getScid() {
    this.connectClientService.getScid();

    let s = getClientIdSubject.pipe(take(1)).subscribe((data) => {
      this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>client id : ${data}</p>`;
    });
  }

  public handleRmdir(rmdirName: string) {
    this._directoryCrudService.rmdir('cl.aniketraj@gmail.com', rmdirName);

    let s: Subscription = rmdirSubject
      //take(1) used to emit the latest event skiping the older events
      .pipe(take(1))
      .subscribe((data) => {
        if (!data) {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>Directory '${rmdirName}' removed!</p>`;
          return;
        } else {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-danger'>${data}</p>`;
        }
        //not to be called multiple times rxjs
        s.unsubscribe();
      });
  }

  public handleRmdirForce(rmdirName: string) {
    this._directoryCrudService.rmdirForce('cl.aniketraj@gmail.com', rmdirName);

    let s: Subscription = rmdirForceSubject
      //take(1) used to emit the latest event skiping the older events
      .pipe(take(1))
      .subscribe((data) => {
        if (!data) {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>Directory '${rmdirName}' removed forcefully!</p>`;
          return;
        } else {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-danger'>${data}</p>`;
        }

        //not to be called multiple times rxjs
        s.unsubscribe();
      });
  }

  public handleMkdir(mkdirName: string) {
    this._directoryCrudService.mkdir('cl.aniketraj@gmail.com', mkdirName);

    let s: Subscription = mkdirSubject
      //take(1) used to emit the latest event skiping the older events
      .pipe(take(1))
      .subscribe((data) => {
        if (!data) {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>Directory '${mkdirName}' created!</p>`;
          return;
        } else {
          this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-danger'>${data}</p>`;
        }

        //not to be called multiple times rxjs
        s.unsubscribe();
      });
  }

  public handleCd(cd: string) {
    this._directoryCrudService.cd('cl.aniketraj@gmail.com', cd);

    let s = cdSubject.subscribe((data) => {
      if (!data) {
        this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-danger'>Given path '${cd}' does not exist!</p>`;
        return;
      }

      let temp = (data as string).split('\\');
      let tPath = temp.join('\\');
      this.rootDirService.rootDir = tPath;
      //not to be called multiple times rxjs
      s.unsubscribe();
    });
  }

  public handleLs() {
    this._directoryCrudService.ls('cl.aniketraj@gmail.com');

    let s = lsSubject.subscribe((data: any) => {
      // console.log(data);

      this.cmdPrintArea.nativeElement.innerHTML += `<p class="text-danger">
      Directory of ${this.rootDirService.rootDir}
      </p>
      `;

      if (data.length < 1) {
        this.cmdPrintArea.nativeElement.innerHTML += `<p class="text-warning">Empty directory</p>`;
      } else
        data.forEach((element: any) => {
          this.cmdPrintArea.nativeElement.innerHTML += `
        <div class="directory-listing">
          <div class="directory">
            <div class="directory-details">
              <span class="text-white">${new Date(
                element.stats.birthtime
              ).toLocaleString()}</span>
              <span class="text-warning">&lt;${
                element.isDir ? 'DIR' : 'FILE'
              }&gt;</span>
              <span class="directory-name text-primary mx-4 px-4">${
                element.name
              }</span>
            </div>
          </div>
        </div>
        <p></p>
        `;
        });
      //prevents multiple emision as stored in rxjs
      s.unsubscribe();
    });
  }

  public ipAddress!: string;

  public loadRootDirOnTerminal() {
    this.websocketService.socket.emit(
      'getCmdRootDir',
      'cl.aniketraj@gmail.com'
    );

    let subscription: Subscription = this.websocketService
      .onMessage('getCmdRootDirRes')
      .subscribe((rootDir) => {
        rootDir = rootDir;
        this.rootDirService.rootDir = rootDir;
        rootDirSubject.next(rootDir);

        //prevents multiple emission
        subscription.unsubscribe();
      });
  }

  public async connectToClient(ipAddress: string) {
    this.ipAddress = ipAddress;
    this.connectClientService.connectToClient(this.ipAddress);
  }

  public async disconnectToClient(ipAddress?: string) {
    try {
      this.websocketService.disconnectToServer();
      this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-success'>${this.rootDirService.rootDir} > disconnected from ${this.ipAddress}</p>`;
      this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-primary'>${this.rootDirService.rootDir} >run command connect -->ipaddress<-- to again connect and to run ohter commands!`;
      return;
    } catch (err) {
      this.cmdPrintArea.nativeElement.innerHTML += `<p class='text-danger'>${this.rootDirService.rootDir} > disconnecting to ${this.ipAddress} failed.</p>`;
    }
  }

  public async clsScreen() {
    this.cmdPrintArea.nativeElement.innerHTML = ``;

    return true;
  }
}
