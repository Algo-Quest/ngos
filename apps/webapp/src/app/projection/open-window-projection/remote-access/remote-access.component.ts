import {
  Component,
  ComponentRef,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebsocketService } from '../../../shared/services/socket.service';
import { ClientService } from '../../../shared/services/client';
import { take } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { windowRef } from '../../../shared/services/window-ref';
import {
  callerScreenCreatedSubject,
  ngShareCreateAnswerSubject,
  ngShareOfferResSubject,
  sendCallReqSubject,
} from '../../../shared/subject/ngShareCreateAnswer';

@Component({
  selector: 'ngos-remote-access',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './remote-access.component.html',
  styleUrls: ['./remote-access.component.css'],
})
export class RemoteAccessComponent {
  @Input() openWindowProjection!: ComponentRef<any>;
  @Input() myComponentId!: string | number;
  @Input() remoteAccessComponentArrayRef!: ComponentRef<any>[];
  @Input() appName!: string;
  public isLoading: boolean = true;

  public config: any;
  public peerConnection: any;
  public mediaStream!: any;

  public callerScreenComRef!: ComponentRef<any>;

  constructor(
    private readonly _ws: WebsocketService,
    private _clientService: ClientService
  ) {
    this.config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    this.peerConnection = new RTCPeerConnection(this.config);
  }

  ngAfterViewInit() {
    // this.captureScreen();
    setTimeout(() => {
      this.isLoading = false;
    }, 100);

    //
    this.eventListener();
    this.rxjsEventListener();
    //
  }

  public isRemoteClient!: boolean;
  public isLocalClient!: boolean;

  public async rxjsEventListener() {
    //after getting offer json let us create answer it sets offer json
    //offer is put in the callee client
    ngShareCreateAnswerSubject.pipe(take(1)).subscribe(async (res: any) => {
      this.isRemoteClient = true;
      const offerDesc = new RTCSessionDescription(
        JSON.parse(res.localDescription)
      );
      await this.peerConnection.setRemoteDescription(offerDesc);

      //aftre offer create answer event
      await this.peerConnection.setLocalDescription(
        await this.peerConnection.createAnswer()
      );
    });

    //once the caller screen component created andd on load it emits true msg so, make call request
    callerScreenCreatedSubject.subscribe(async () => {
      //create offer as entire json
      await this.peerConnection.setLocalDescription(
        await this.peerConnection.createOffer()
      );
    });
  }

  public async eventListener() {
    this._ws
      .onMessage('ngShareCallAnswerResCloseCallerScreen')
      .pipe(take(1))
      .subscribe(() => {
        //clicked on receice call a/c to socket server res close/destroy the caller screen component
        this.callerScreenComRef?.destroy();
      });

    // ngShareCallOfferRes is written in app.componnet.ts as offer may be denied and in case ngShare is not opened then
    //the listener won't work as this component is not yet created so, called in app.component.ts
    //*****  answer is put in the caller
    this._ws
      .onMessage('ngShareCallAnswerRes')
      .pipe(take(1))
      .subscribe(async (res) => {
        // console.log(res);
        // res.localDescription the answer entire json through socker server response
        const answerDesc = new RTCSessionDescription(
          JSON.parse(res.localDescription)
        );
        await this.peerConnection.setRemoteDescription(answerDesc);
      });

    //this is event listener works for both offer / answer
    // it gets called / listened whenever createAnswer() / createOffer() is called
    await this.peerConnection.addEventListener(
      'icecandidate',
      async ({ candidate }: any) => {
        if (candidate == null) {
          let localDescription = JSON.stringify(
            this.peerConnection.localDescription
          );
          // console.log('o/a');
          // console.log(localDescription);
          const clientConnectedInfo = this._clientService.clientConnectedInfo;
          Object.assign(clientConnectedInfo, { localDescription });

          if (this.peerConnection.localDescription.type == 'offer') {
            this._ws.socket.emit('ngShareCallOffer', clientConnectedInfo);
          } else if (this.peerConnection.localDescription.type == 'answer') {
            //create answer as it will call onicecandidate addeventlister as createOffer()/createAnswer() calls onicecandidate event listener

            this._ws.socket.emit('ngShareCallAnswer', clientConnectedInfo);
          }
        }
      }
    );

    await this.peerConnection.addEventListener('track', function (event: any) {
      const remotevideo = document.getElementById(
        'remote-video'
      ) as HTMLVideoElement;

      console.log('Remote stream added:', event);

      remotevideo.srcObject = event.streams[0];
    });

    await this.peerConnection.addEventListener(
      'connectionstatechange',
      (e: any) => {
        if (this.peerConnection.connectionState === 'connected') {
          // Connected!
          console.log('connected++');
          // setInterval(() => {
          //   activeDataChannel.send(
          //     JSON.stringify({ message: "Hi" })
          //   );
          // }, 1000);
        }
      }
    );
  }

  public async receive() {
    this._ws.socket.emit('');
  }

  public async call() {
    this.isLocalClient = true;
    //indicates that we clicked on call btn and it emits call req via rxjs
    //according to our logic when captureScreen function gets called inside it we wrote like to createOffer()
    //so, as this function gets called it createsOffer() -> calls addEventListener 'onicecandidate' event listener -> and starts executing all process
    await this.captureScreen();

    let callScreenComp = await import(
      '../../../communication/caller-screen/caller-screen.component'
    );

    let myCreatedCompRef = windowRef.baseWinRef.createComponent(
      callScreenComp.CallerScreenComponent
    ) as ComponentRef<any>;
    //provide some message to newly created component
    myCreatedCompRef.instance.myMsg = 'HELLO';

    this.callerScreenComRef = myCreatedCompRef;
  }

  public async captureScreen() {
    try {
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        },
        audio: false,
      } as any);

      const videoElem = document.getElementById(
        'local-video'
      ) as HTMLVideoElement;

      videoElem.srcObject = this.mediaStream;

      await this.mediaStream.getTracks().forEach(async (track: any) => {
        console.log('add track');
        await this.peerConnection.addTrack(track, this.mediaStream);
      });

      // console.log(this.mediaStream);
      // const clientConnectedInfo = this._clientService.clientConnectedInfo;
    } catch (err) {
      console.log('Error occurred', err);
    }
  }

  async captureAudio() {
    let audioStream = null;
    try {
      /**
        Getting audio from microphone
        **/
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch (ex) {
      console.log('Error occurred', ex);
    }
  }
}
