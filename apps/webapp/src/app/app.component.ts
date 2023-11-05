import {
  Component,
  ComponentRef,
  ElementRef,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { DockerPanelComponent } from './docker-panel/docker-panel.component';
import { PreventContextMenuUseCase } from './use-case/prevent-context-menu';
import { OpenCustomRightClickMenuUseCase } from './use-case/open-custom-right-click-menu';
import { OpenWindowUseCase } from './use-case/open-window';
import { MouseEventService } from '@ngos/helper';
import { DockerPanelName } from './docker-panel/constants/docker-panel';
import { Type } from './constants/constants';
import { ApplyMoveDirective } from './shared/directives/apply-move.directive';
import { FolderComponent } from './file-folder/folder/folder.component';
import { folderSubject } from './file-folder/folder/folder.subject';
import { Subject, Subscription, map, switchMap, take, takeUntil } from 'rxjs';
import { fileSubject } from './file-folder/file/file.subject';
import { WebsocketService } from './shared/services/socket.service';
import { environment } from '../environments/environment';
import { ClientService } from './shared/services/client';
import { grantAccessToRemoteSubject } from './shared/subject/remote-access.subject';
import { windowRef } from './shared/services/window-ref';
import { allTaskList } from './shared/services/task-ref';
import { ngShareService } from './shared/services/ngShareCallReceive';
import {
  ngShareCreateAnswerSubject,
  ngShareOpenAppIfNotBecauseComponentCreateRequired,
  nsShareReceivedCallSubject,
} from './shared/subject/ngShareCreateAnswer';
import { ClickedElemTargetService } from './shared/services/clicked-elem-targt';
import { DesktopMouseSelectionService } from './shared/services/desktop-mouse-selection';
import { MonacoEditorComponent } from './monaco-editor/monaco.component';
import { ExplorerCompArrRefService } from './shared/services/explorerCompArrRef';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    DockerPanelComponent,
    ApplyMoveDirective,
    FolderComponent,
    MonacoEditorComponent,
  ],
  providers: [
    PreventContextMenuUseCase,
    OpenCustomRightClickMenuUseCase,
    OpenWindowUseCase,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public explorerData!: { appName: string; type: string };
  public componentCount: number = 0;

  //it can also create component ViewContainerRef
  @ViewChild('openWindow', { read: ViewContainerRef })
  openWindowRef!: ViewContainerRef;
  public title: string = 'ngos';

  @ViewChild('openWindowProjection', { read: TemplateRef })
  openWindowProjection!: ViewContainerRef;

  @ViewChild('mainDesktop', { read: ViewContainerRef })
  mainDesktopRef!: ViewContainerRef;

  @ViewChild('mainBaseScreen', { read: ViewContainerRef })
  baseDesktopRef!: ViewContainerRef;

  //same used for elementRef not for viewContainerRef
  @ViewChild('mainBaseScreen', { read: ElementRef })
  baseScreen!: ElementRef;

  constructor(
    private readonly _preventContextMenuUseCase: PreventContextMenuUseCase,
    private readonly _openCustomRightClickMenuUseCase: OpenCustomRightClickMenuUseCase,
    private _mouseEventService: MouseEventService,
    private websocketService: WebsocketService,
    private _clientService: ClientService,
    private _clickedElemTargetService: ClickedElemTargetService,
    private _desktopMouseSelectionService: DesktopMouseSelectionService,
    private _explorerComponentArrayRefService: ExplorerCompArrRefService
  ) {}

  async ngAfterViewInit() {
    //disable right click on browser
    this.preventContextMenu();

    document.addEventListener('click', () => {
      //make sure no rectangle selection should made if we select through mouse selection via moving it
      if (this._desktopMouseSelectionService.isSelected) {
        this._desktopMouseSelectionService.isSelected = false;
        let msd = Array.from(
          document.querySelectorAll('[mouseselection="true"]')
        ) as HTMLElement[];

        //make transparent color bg the mouse selected ones
        msd.forEach((elemX) => {
          elemX.style.background = 'transparent';
        });
      }
    });

    //let viewChild init via life-cycle-hook
    windowRef.baseWinRef = this.baseDesktopRef;
    windowRef.baseWinRefAsElementRef = this.baseScreen;

    //click handler
    this.clickEventOnElement();
    this.makeSelectionDesktopOnMouseClickMove();
  }

  public makeSelectionDesktopOnMouseClickMoveCancel$ = new Subject();

  public mscComGlobalRef!: ComponentRef<any>;

  public makeSelectionDesktopOnMouseClickMove() {
    this._mouseEventService
      .getMouseStateOnElementDown(document)
      .pipe(
        map((e) => {
          this.makeSelectionDesktopOnMouseClickMoveCancel$.next(true);
          let ev = e as unknown as MouseEvent;
          let clientX = ev.clientX;
          let clientY = ev.clientY;
          return {
            ev,
            clientX,
            clientY,
          };
        }),
        switchMap(async (ev) => {
          if (
            (
              (ev.ev as unknown as MouseEvent).target as HTMLElement
            )?.classList?.contains('top-bar')
          ) {
            // if clicked on not to create mouse-selection return do-not create component
            return;
          }

          //means selection is made via mouse on boxes folder/files
          if (this._desktopMouseSelectionService.isSelected) {
            return;
          }

          let msc = await import(
            './mouse-selection/desktop/desktop-mouse-selection-component'
          );

          let mscCompRef = this.baseDesktopRef.createComponent(
            msc.DesktopMouseSelectionComponent
          ) as ComponentRef<any>;

          this.mscComGlobalRef = mscCompRef;

          return this._mouseEventService
            .getMouseStateOnMove()
            .pipe(
              takeUntil(this.makeSelectionDesktopOnMouseClickMoveCancel$),
              map((ev2) => {
                mscCompRef.instance.mouseMoveElements =
                  ev2 as unknown as MouseEvent;
                //provide some msg to created components
                mscCompRef.instance.mdmyTop = (
                  ev as unknown as MouseEvent
                ).clientY;
                mscCompRef.instance.mdmyLeft = (
                  ev as unknown as MouseEvent
                ).clientX;
                //
                mscCompRef.instance.myTop = (
                  ev2 as unknown as MouseEvent
                ).clientY;
                mscCompRef.instance.myLeft = (
                  ev2 as unknown as MouseEvent
                ).clientX;
              })
            )
            .subscribe();
        })
      )
      .subscribe();

    this._mouseEventService.getMouseStateOnUp().subscribe(() => {
      this.makeSelectionDesktopOnMouseClickMoveCancel$.next(false);
      this.mscComGlobalRef?.destroy();
    });
  }

  public async remoteAccessForMouseAndKeyboard(clientInfo: any) {
    let prevX: any = null;
    let prevY: any = null;

    window.addEventListener('mousemove', (ev: any) => {
      if (prevX !== null && prevY !== null) {
        const deltaX = ev.clientX - prevX;
        const deltaY = ev.clientY - prevY;

        if (deltaX > 0) {
          // console.log('Mouse moved to the right');
          let res = Object.assign(clientInfo, { x: 0.5, y: 0 });
          this.websocketService.socket.emit('mouseChangeEventEmit', res);
        } else if (deltaX < 0) {
          // console.log('Mouse moved to the left');
          let res = Object.assign(clientInfo, { x: -0.5, y: 0 });
          this.websocketService.socket.emit('mouseChangeEventEmit', res);
        }

        if (deltaY > 0) {
          // console.log('Mouse moved down');
          let res = Object.assign(clientInfo, { x: 0, y: 0.5 });
          this.websocketService.socket.emit('mouseChangeEventEmit', res);
        } else if (deltaY < 0) {
          // console.log('Mouse moved up');
          let res = Object.assign(clientInfo, { x: 0, y: -0.5 });
          this.websocketService.socket.emit('mouseChangeEventEmit', res);
        }
      }

      // Update previous mouse coordinates
      prevX = ev.clientX;
      prevY = ev.clientY;
    });
  }

  //as we need to call if ngShare app is not yet opened;
  async ngOnInit() {
    //init socket connection
    await this.websocketService.connectToServer(
      environment.socketServerBaseUrl
    );

    this.websocketService
      .onMessage('no-cmd-tool-client-found')
      .pipe(take(1))
      .subscribe(() => {
        alert('please run the rover app!');
      });

    //
    this.websocketService
      .onMessage('remoteAccessTrueRes')
      .pipe(take(1))
      .subscribe((res) => {
        alert('remote access true now!');
        console.log(res.message);
        this.remoteAccessForMouseAndKeyboard(res.message);
        //
      });
    //

    //set client id in global service
    this.websocketService
      .onMessage('clientId')
      .pipe(take(1))
      .subscribe((id) => {
        this._clientService.clientId = id;
      });

    this.websocketService.onMessage('HELLO').subscribe((data) => {
      let p = prompt('grant access!');
      if (p == 'yes') {
        Object.assign(data, { receivingEmail: 'cl.amitabhanand@gmail.com' });
        grantAccessToRemoteSubject.next(data);
        this.openTerminal({ appName: 'TERMINAL', type: 'APP' });
      }
    });

    //

    //as we will not call socket on other client because if we put in addEvenetLiaatner so, then will  be called so,
    //always put event listener on other context like constructor so, it gets called auto
    this.websocketService
      .onMessage('ngShareCallOfferRes')
      .pipe(take(1))
      .subscribe(async (res) => {
        //store in global service like ngrx createOffer()/Res
        ngShareService.push(res);

        let receiverScreenComp = await import(
          './communication/receiver-screen/receiver-screen.component'
        );

        let receiverScreenCompRef = windowRef.baseWinRef.createComponent(
          receiverScreenComp.ReceiverScreenComponent
        ) as ComponentRef<any>;
        //

        const componentId = new Date().toLocaleDateString();

        //provide info to created component like communication
        receiverScreenCompRef.instance.myComponentId = componentId;

        allTaskList.push({
          winRef: receiverScreenCompRef,
          componentId,
        });
      });

    //

    this.rxjsEventListener();
    //

    //open custom right click menu
    this.openCustomRightClickMenu();
    //
    this.mouseLeftClickEventForDestroyComp();
    //
    this.baseScreenAppsPositionSetter();
  }

  public rxjsEventListener() {
    //listened to subject when clicked on receive ngShareOffer
    ngShareOpenAppIfNotBecauseComponentCreateRequired.subscribe(async (res) => {
      await this.openShare({
        appName: DockerPanelName.share,
        type: Type.app,
      });

      //emit createAnser as we opened the component if not openend so, this opened comp. can receive rxjs events
      setTimeout(() => {
        ngShareCreateAnswerSubject.next(res);
        //just to close receiving-call-screen on btn click receive
        nsShareReceivedCallSubject.next(true);
      });
    });
  }

  public preventContextMenu() {
    this._preventContextMenuUseCase.execute(document);
  }

  //when clicked on right button shows right menu
  public openCustomRightClickMenu() {
    this._mouseEventService
      .getMouseStateOnContextMenu()
      .subscribe((ev: any) => {
        // console.log(ev.target);
        if ((ev as unknown as MouseEvent).button == 2) {
          this._openCustomRightClickMenuUseCase.execute(ev, {
            mainDesktopRef: this.mainDesktopRef,
            baseDesktopRef: this.baseDesktopRef,
          });

          // console.log(((ev as unknown as MouseEvent).target as HTMLElement).role);
          // if (
          //   ((ev as unknown as MouseEvent).target as HTMLElement).role == 'drive'
          // ) {
          //   // perform different usecase execute
          //   this._openCustomRightClickMenuUseCase.execute(
          //     ev,
          //     this.mainDesktopRef
          //   );
          // }
        }
      });
  }

  //when click on any item via mouse click store clicked event target for future use;
  public clickEventOnElement() {
    this._mouseEventService
      .getMouseStateOnElementClick(document)
      .subscribe((event) => {
        const ev = event as unknown as MouseEvent;
        this._clickedElemTargetService.currentClickedElemTarget = ev;
        this._clickedElemTargetService.currentClickedElemTargetRole = (
          ev.target as HTMLElement
        ).role;
      });
  }

  public mouseLeftClickEventForDestroyComp() {
    this._mouseEventService.getMouseStateOnClick().subscribe((event: any) => {
      const target = event.target;

      //for taskmgr if clicked on task mgr icon then do not clear mainDesktopRef as it will clear the created component
      if (target.role == DockerPanelName.taskManager) return;
      if (
        target.tagName != 'TD' &&
        target.tagName != 'TR' &&
        target.tagName != 'SPAN' &&
        target.tagName != 'I' &&
        target.tagName != 'TBODY'
      ) {
        //clear right menu which comes on desktop if not clicked on tr,td,tbody of table
        this.mainDesktopRef.clear();
      }
    });
  }

  public async dockerAppOpenerEvent(event: { appName: string; type: string }) {
    if (event.type == Type.app && event.appName == DockerPanelName.explorer) {
      return await this.openExplorer(event);
    } else if (
      event.type == Type.app &&
      event.appName == DockerPanelName.taskManager
    ) {
      return this.openTaskManager(event);
    } else if (
      event.type == Type.app &&
      event.appName == DockerPanelName.terminal
    ) {
      return this.openTerminal(event);
    } else if (
      event.type == Type.app &&
      event.appName == DockerPanelName.share
    ) {
      return this.openShare(event);
    }
  }

  public async openShare(event: { appName: string; type: string }) {
    //
    let remoteAccessComponent = await import(
      './projection/open-window-projection/remote-access/remote-access.component'
    );
    //
    let comp = await import('./open-window/open-window.component');
    let winRef = this.openWindowRef.createComponent(
      comp.OpenWindowComponent
    ) as ComponentRef<any>;

    //store address to close the window
    this._explorerComponentArrayRefService.explorerComponentArrayRef.push(
      winRef
    );

    winRef.instance.openWindowProjection =
      remoteAccessComponent.RemoteAccessComponent;
    winRef.instance.myComponentId = this.componentCount++;
    //here explorerComponentArrayRef is set globally so, use explorerComponentArrayRef this name to use for close window purpose otherwise won't work
    winRef.instance.explorerComponentArrayRef =
      this._explorerComponentArrayRefService.explorerComponentArrayRef;
    winRef.instance.appName = event.appName;

    allTaskList.push({
      winRef,
      componentId: winRef.instance.myComponentId,
    });
  }

  public async openExplorer(event: { appName: string; type: string }) {
    this.explorerData = event;
    //will clear like innerHTML = ``;
    // this.openWindowRef.clear();
    //first dynamic component call it first as import takes time to read and may send undefined first time
    let explorerComp = await import(
      './projection/open-window-projection/drive/drive.component'
    );

    //second dynamic component
    let comp = await import('./open-window/open-window.component');
    let winRef = this.openWindowRef.createComponent(
      comp.OpenWindowComponent
    ) as any;

    //
    this._explorerComponentArrayRefService.explorerComponentArrayRef.push(
      winRef
    );

    //providing ng-content msg/template from here and msgs
    winRef.instance.openWindowProjection = explorerComp.DriveComponent;
    winRef.instance.myComponentId = this.componentCount++;
    winRef.instance.explorerComponentArrayRef =
      this._explorerComponentArrayRefService.explorerComponentArrayRef;
    winRef.instance.appName = event.appName;
    // winRef.changeDetectorRef.detectChanges();

    allTaskList.push({
      winRef,
      componentId: winRef.instance.myComponentId,
    });
  }

  public taskManagerEvent!: { appName: string; type: string };

  public async openTaskManager(event: {
    appName: string;
    type: string;
    myElementRef?: HTMLDivElement;
  }) {
    this.taskManagerEvent = event;
    //will clear like innerHTML = ``;
    this.mainDesktopRef.clear();
    //first dynamic component call it first as import takes time to read and may send undefined first time
    let taskmgrComp = await import('./task-manager/task-manager.component');

    let winRef = this.mainDesktopRef.createComponent(
      taskmgrComp.TaskManagerComponent
    ) as ComponentRef<any>;

    //
    // this.explorerComponentArrayRef.push(winRef);

    //providing ng-content msg/template from here and msgs
    winRef.instance.myElementRef = event.myElementRef;
    // winRef.changeDetectorRef.detectChanges();

    allTaskList.push({
      winRef,
      componentId: winRef.instance.myComponentId,
    });
  }

  public async openTerminal(event: {
    appName: string;
    type: string;
    myElementRef?: HTMLDivElement;
  }) {
    //will clear like innerHTML = ``;
    // this.mainDesktopRef.clear();
    //first dynamic component call it first as import takes time to read and may send undefined first time
    let terminalComp = await import(
      './projection/open-window-projection/terminal/terminal.component'
    );

    //second dynamic component
    let comp = await import('./open-window/open-window.component');
    let winRef = this.openWindowRef.createComponent(
      comp.OpenWindowComponent
    ) as any;

    //
    this._explorerComponentArrayRefService.explorerComponentArrayRef.push(
      winRef
    );

    //providing ng-content msg/template from here and msgs
    winRef.instance.openWindowProjection = terminalComp.TerminalComponent;
    winRef.instance.myComponentId = this.componentCount++;
    //here explorerComponentArrayRef is set globally so, use explorerComponentArrayRef this name to use for close window purpose otherwise won't work
    winRef.instance.explorerComponentArrayRef =
      this._explorerComponentArrayRefService.explorerComponentArrayRef;
    winRef.instance.appName = event.appName;
    //

    allTaskList.push({
      winRef,
      componentId: winRef.instance.myComponentId,
    });
  }

  public folderSubject$!: Subscription;
  public fileSubject$!: Subscription;

  public columnChangerAboutScreenHeightBool!: boolean;

  public baseScreenAppsPositionSetter(): void {
    this.folderPositionSetter();
    this.filePositionSetter();
  }

  public folderPositionSetter(): void {
    //folder create event from right menu rxjs
    this.folderSubject$ = folderSubject.subscribe((data) => {
      let filesfoldersList = Array.from(
        document.querySelectorAll('.file-folder') || []
      );

      let createdFilesFoldersList = [
        ...filesfoldersList,
      ] as unknown as HTMLElement[];

      if (createdFilesFoldersList.length == 1) return;

      let lastElem = (
        createdFilesFoldersList as unknown as HTMLElement[]
      ).slice(-1)[0];

      //access one prev to prev element
      let getBoundingRect =
        createdFilesFoldersList[
          createdFilesFoldersList.length - 1 - 1
        ].getBoundingClientRect();

      if (getBoundingRect.top + getBoundingRect.height > window.screen.height) {
        //set the last elem pointer to top and move left for second row
        (lastElem as HTMLElement).style.top = 0 + 'px';
        (lastElem as HTMLElement).style.left =
          getBoundingRect.left + getBoundingRect.width + 'px';
        return;
      } else {
        (lastElem as HTMLElement).style.top =
          getBoundingRect.top + getBoundingRect.height + 'px';

        (lastElem as HTMLElement).style.left = getBoundingRect.left + 'px';
      }
    });
  }

  public filePositionSetter(): void {
    //file create event from right menu rxjs
    this.fileSubject$ = fileSubject.subscribe((data) => {
      let filesfoldersList = Array.from(
        document.querySelectorAll('.file-folder') || []
      );

      let createdFilesFoldersList = [
        ...filesfoldersList,
      ] as unknown as HTMLElement[];

      if (createdFilesFoldersList.length == 1) return;

      let lastElem = (
        createdFilesFoldersList as unknown as HTMLElement[]
      ).slice(-1)[0];

      //access one prev to prev element
      let getBoundingRect =
        createdFilesFoldersList[
          createdFilesFoldersList.length - 1 - 1
        ].getBoundingClientRect();

      if (getBoundingRect.top + getBoundingRect.height > window.screen.height) {
        //set the last elem pointer to top and move left for second row
        (lastElem as HTMLElement).style.top = 0 + 'px';
        (lastElem as HTMLElement).style.left =
          getBoundingRect.left + getBoundingRect.width + 'px';
        return;
      } else {
        (lastElem as HTMLElement).style.top =
          getBoundingRect.top + getBoundingRect.height + 'px';

        (lastElem as HTMLElement).style.left = getBoundingRect.left + 'px';
      }
    });
  }

  ngOnDestroy(): void {
    this.folderSubject$.unsubscribe();
    this.fileSubject$.unsubscribe();
  }

  public get getFormattedDate() {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const now = new Date();
    const dayOfWeek = daysOfWeek[now.getDay()];

    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 24-hour time to 12-hour time

    const minutes = now.getMinutes();

    const formattedDate = `${dayOfWeek} ${hours}:${
      minutes < 10 ? '0' : ''
    }${minutes} ${ampm}`;

    return formattedDate;
  }
}
