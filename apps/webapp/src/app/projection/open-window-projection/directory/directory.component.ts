import {
  Component,
  ComponentRef,
  ElementRef,
  Input,
  QueryList,
  Renderer2,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { directoryInfoType } from '../../../types/directory-info';
import { Subject, map, take } from 'rxjs';
import { rightMenuRowSelectorHighlight } from '../../../shared/subject/right-menu-row-selector-highlight';
import { viewModeSubject } from '../../../shared/subject/view-mode.subject';
import { commonDeskTopRightMenuSubject } from '../../../shared/subject/common-desktop-right-menu.subject';
import { WebsocketService } from '../../../shared/services/socket.service';
import { myInfo } from '../../../shared/services/my-info';
import { ExplorerDirInfoService } from '../../../shared/services/explorer-dir-info';
import { windowRef } from '../../../shared/services/window-ref';
import { ExplorerCompArrRefService } from '../../../shared/services/explorerCompArrRef';
import { allTaskList } from '../../../shared/services/task-ref';

@Component({
  selector: 'ngos-directory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directory.component.html',
  styleUrls: ['./directory.component.css'],
})
export class DirectoryComponent {
  @Input() myDirectoryPathVisited!: directoryInfoType[];
  @Input() mydirectoryPathVisitedSubject!: Subject<directoryInfoType[]>;
  @Input() myCompId!: string;

  @Input() dirInfo!: (directoryInfoType & { newly?: boolean })[];

  constructor(
    private readonly _renderer: Renderer2,
    private readonly _ws: WebsocketService,
    private _explorerDirInfoService: ExplorerDirInfoService,
    private _explorerComponentArrayRefService: ExplorerCompArrRefService
  ) {}

  public fileFolderClickHandler(
    dirInfo: directoryInfoType,
    isBlur: boolean | undefined
  ) {
    //if folder then
    if (dirInfo.isDir) return this.folderClickHandler(dirInfo, isBlur);
    if (dirInfo.isFile) return this.fileClickHandler(dirInfo, isBlur);
  }

  public folderClickHandler(
    dirInfo: directoryInfoType,
    isBlur: boolean | undefined
  ) {
    if (isBlur) return;

    //event rxjs emitter afftects route to detect change and call socket to load new dir
    this.myDirectoryPathVisited.push(dirInfo);
    // this.mydirectoryPathVisitedSubject.next(this.myDirectoryPathVisited);

    this.dirPathVisit = this.myDirectoryPathVisited;
    const _dirInfo = this.myDirectoryPathVisited;
    let dirInfoWithUserInfo = {
      dirInfo: _dirInfo,
      userInfo: myInfo,
    };
    this._ws.socket.emit('directoryChange', dirInfoWithUserInfo);
    //take (1) to make sure it should emit one means one explorer change dir not effect other explorer dir
    this._ws
      .onMessage('directoryChangeRes')
      .pipe(take(1))
      .subscribe((filesArr) => {
        this.dirInfo = filesArr;
      });
  }
  public async fileClickHandler(
    dirInfo: directoryInfoType,
    isBlur: boolean | undefined
  ) {
    //open file logic will appear here
    if (isBlur) return;
    //where the server directory is actually from directory of exploerer drive (directory) and get the path from id
    // as the drive is the main id and same for all explorer component as drive create the exploerre and directory componeent
    // drive is always created if we open exploerer and it then creates directory componenent  inside it
    let path = this._explorerDirInfoService.explorerDirInfoMap[this.myCompId];

    let allInfo = {
      myInfo,
      dirInfo,
      path,
    };

    let imgexts = ['jpeg', 'jfif', 'png', 'jpg'];

    if (dirInfo?.name?.split('.')[1]) console.log(dirInfo.name);

    this._ws.socket.emit('openFile', allInfo);

    this._ws
      .onMessage('openFileRes')
      .pipe(take(1))
      .subscribe(async (fileData) => {
        let monacoComp = await import(
          '../../../monaco-editor/monaco.component'
        );
        let comp = await import('../../../open-window/open-window.component');

        let winRef = windowRef.baseWinRef.createComponent(
          comp.OpenWindowComponent
        ) as ComponentRef<any>;

        winRef.instance.openWindowProjection = monacoComp.MonacoEditorComponent;
        winRef.instance.myComponentId =
          'file_' + new Date().getMilliseconds() + Math.random();
        //store address to close the window
        this._explorerComponentArrayRefService.explorerComponentArrayRef.push(
          winRef
        );
        //here explorerComponentArrayRef is set globally so, use explorerComponentArrayRef this name to use for close window purpose otherwise won't work
        winRef.instance.explorerComponentArrayRef =
          this._explorerComponentArrayRefService.explorerComponentArrayRef;
        winRef.instance.appName = 'NgTextEditor';

        //set provide height/width ans other prop. of monaco editor
        winRef.instance.myData = {
          fileData: fileData,
          height: '800px',
        };
        //to listen to output event emitter in dynamic created component
        // winRef.instance.onEditorChange.subscribe((ev: any) => console.log(ev));
        allTaskList.push({
          winRef,
          componentId: winRef.instance.myComponentId,
        });
      });
  }

  public dirPathVisit!: any[];

  @ViewChildren('directoryRightMenuColumn')
  directoryRightMenuColumn!: QueryList<ElementRef>;

  public tilesView: boolean = false;

  // public async directoryPathServiceSubjectChange() {
  //   this.mydirectoryPathVisitedSubject.subscribe((_dirInfo) => {
  //   });
  // }

  ngAfterViewInit() {
    // this.directoryPathServiceSubjectChange();
    //to higlight the row darker logic only when double right click is made
    rightMenuRowSelectorHighlight.subscribe((target) => {
      this.rowHighlightHandler(target);
    });
    //
    viewModeSubject.subscribe((ev) => {
      const { viewMode, event } = ev as { event: MouseEvent; viewMode: string };
      const target = event.target as unknown as HTMLElement;
      let type = target.getAttribute('type');
      if (
        target.role == 'show-common-desktop-right-menu' &&
        type == 'directory'
      ) {
        if (viewMode == 'tiles') {
          this.tilesView = true;
        } else {
          this.tilesView = false;
        }
      }
    });
  }

  public rowHighlightHandler(target: any, flag?: boolean) {
    let trgt = target as unknown as HTMLElement;

    let indexByParentclassName = trgt.getAttribute(
      'classname'
    ) as unknown as number;

    if (flag) indexByParentclassName--;

    if (
      trgt.role == 'directory-right-menu-column' ||
      trgt.role == 'show-common-desktop-right-menu'
    ) {
      this.directoryRightMenuColumn.forEach((elem) => {
        let childIndex = elem.nativeElement.getAttribute(
          'classname'
        ) as unknown as number;

        if (childIndex == indexByParentclassName) {
          this._renderer.addClass(elem.nativeElement, 'active');
        } else {
          this._renderer.removeClass(elem.nativeElement, 'active');
        }
      });
    }
  }

  ngOnInit() {
    //when click on new folder it catches the event
    commonDeskTopRightMenuSubject
      .pipe(
        map((_event: any) => {
          let ev: { target: PointerEvent; type: 'folder' } = _event;
          //
          if (ev.type == 'folder') {
            let event = ev as { target: MouseEvent; type: string };

            let compId = (event.target.target as HTMLElement).getAttribute(
              'componentid'
            );

            const _dirPathVisit = this.myDirectoryPathVisited;
            const dirPathInfoWithUserInfo = Object.assign(myInfo, {
              path: _dirPathVisit,
              mkdirName: undefined,
            });
            //

            /** examle taken as 3 but may be 4 to n
             *
             * Component Id match to emit to only one component as we had three subscribers for one subject so, problem was creating three folders becaise three compnents created and listened for that one subject
             *so, matching via component id we emit once
             *we have set myCompId attribute on the TR/TD of table by which we click and from ev.target we get componentid
             * ans matches with the current myCompId is the id provided when this component created in drive component via instance
             */
            if (this.myCompId == compId) {
              this._ws.socket.emit(
                'directoryFolderCreated',
                dirPathInfoWithUserInfo
              );
            }

            //this listeners work only when emitted as we emit only once as per our if condition compId match technique
            this._ws.onMessage('directoryFolderCreatedRes').subscribe(() => {
              let myPath = this.myDirectoryPathVisited;
              let dirInfoWithUserInfo = {
                dirInfo: myPath,
                userInfo: myInfo,
              };
              //emit same above socket.io to get as onMsg listener will listen ans auto update the directory
              this._ws.socket.emit('directoryChange', dirInfoWithUserInfo);
              //
              //take (1) to make sure it should emit one means one explorer change dir not effect other explorer dir
              this._ws
                .onMessage('directoryChangeRes')
                .pipe(take(1))
                .subscribe((filesArr) => {
                  this.dirInfo = filesArr;
                });
            });

            // console.log(event.target.target);
            // let indexByClassName = (
            //   event.target.target as HTMLElement
            // ).getAttribute('classname') as unknown as number;

            // //**** splice here works as add elements in position if 3 arsg in splice
            // this.dirInfo.splice(+indexByClassName, 0, {
            //   type: event.type,
            //   name: '',
            //   isDir: true,
            //   id: new Date().toString(),
            //   newly: true,
            // });
          } else if (ev.type == 'file') {
            let event = ev as { target: MouseEvent; type: string };

            let compId = (event.target.target as HTMLElement).getAttribute(
              'componentid'
            );

            const _dirPathVisit = this.myDirectoryPathVisited;
            const dirPathInfoWithUserInfo = Object.assign(myInfo, {
              path: _dirPathVisit,
              fileName: 'New File ',
            });
            //

            /** examle taken as 3 but may be 4 to n
             *
             * Component Id match to emit to only one component as we had three subscribers for one subject so, problem was creating three folders becaise three compnents created and listened for that one subject
             *so, matching via component id we emit once
             *we have set myCompId attribute on the TR/TD of table by which we click and from ev.target we get componentid
             * ans matches with the current myCompId is the id provided when this component created in drive component via instance
             */
            if (this.myCompId == compId) {
              this._ws.socket.emit('createFile', dirPathInfoWithUserInfo);
            }

            this._ws.onMessage('createFileRes').subscribe((newfileid) => {
              const idToDetectNewFile = newfileid;
              this.dirPathVisit = this.myDirectoryPathVisited;
              const _dirInfo = this.myDirectoryPathVisited;
              let dirInfoWithUserInfo = {
                dirInfo: _dirInfo,
                userInfo: myInfo,
              };
              this._ws.socket.emit('directoryChange', dirInfoWithUserInfo);
              //take (1) to make sure it should emit one means one explorer change dir not effect other explorer dir
              this._ws
                .onMessage('directoryChangeRes')
                .pipe(take(1))
                .subscribe((filesArr) => {
                  this.dirInfo = filesArr;

                  let findX = this.dirInfo.findIndex(
                    (elem) => elem.name == idToDetectNewFile
                  ) as number;

                  let n = this.dirInfo[findX] as directoryInfoType & {
                    newly: boolean;
                  };

                  n.newly = true;
                  n.isFile = true;
                  n.isDir = false;
                  n.newFileNameAfterCheckInServer = newfileid;

                  // findX.name = ev.value;
                });
            });
          }
          return ev;
        })
      )
      .subscribe((ev: any) => {
        //needs async function to make it excute otherwise it doesn't detect new created row
        setTimeout(() => {
          this.rowHighlightHandler(
            ((ev as unknown as MouseEvent).target as unknown as MouseEvent)
              .target,
            true
          );
        });
      });
  }

  public newlyInputBlur(ev: HTMLInputElement, dirInfo: directoryInfoType) {
    this.dirInfo.forEach((e) => {
      e.newly = false;
    });
  }
}
