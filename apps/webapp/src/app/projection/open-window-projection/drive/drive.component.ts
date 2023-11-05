import {
  Component,
  ComponentRef,
  ElementRef,
  Injector,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { directoryInfoType } from '../../../types/directory-info';
import { BehaviorSubject, take } from 'rxjs';
import { WebsocketService } from '../../../shared/services/socket.service';
import { ClientService } from '../../../shared/services/client';
import { myInfo } from '../../../shared/services/my-info';
import { ExplorerDirInfoService } from '../../../shared/services/explorer-dir-info';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ngos-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drive.component.html',
  styleUrls: ['./drive.component.css'],
})
export class DriveComponent {
  // for every new createComponent() this created separate componenet.html and attaches separate component.ts
  // createComponent() -> separate componenet.html &  separate component.ts so, every event is diferent for every new html view in open window
  // so component.ts logic works for  html does not affect other created component html & ts
  //above working criteria
  @Input() openWinRootDriveViewRef!: ViewContainerRef;
  @Input() myData!: string;

  @ViewChild('driveDirViewRef', { read: ViewContainerRef })
  driveDirViewRef!: ViewContainerRef;

  public driveCompId: number = new Date().getMilliseconds() + Math.random();

  public directoryMode: boolean = false;
  public directoryPathVisited: directoryInfoType[] = [
    {
      type: 'root-drive',
      id: 'THIS_PC',
      name: 'This PC',
    },
  ];
  public directoryPathVisitedSubject: BehaviorSubject<directoryInfoType[]> =
    new BehaviorSubject<directoryInfoType[]>(this.directoryPathVisited);

  public visitedPathHistoryTrack: directoryInfoType[] = [];

  public directoryPathVisited$ =
    this.directoryPathVisitedSubject.asObservable();

  constructor(
    private readonly vcr: ViewContainerRef,
    private readonly _ws: WebsocketService,
    private readonly _clientService: ClientService,
    private _explorerDirInfoService: ExplorerDirInfoService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this._explorerDirInfoService.explorerDirInfoMap[this.driveCompId] =
      this.directoryPathVisited;
    //rxjs directory change detector subscribed
    //this is $ part to check here in drive component only (does not need)

    //directoryPathVisitedSubject is the subject provied in the created component directory dynaic comp. created
    // provided as instance to it works good
    // this.directoryPathVisited$.subscribe((dirInfo: directoryInfoType[]) => {
    //   //write now this $ subject has nothing to do with any logic
    //   //1 means at root-dir we are on so, drive view should be visible
    //   if (this.directoryPathVisited.length == 1) {
    //     this.directoryMode = false;
    //     this.driveDirViewRef.clear();
    //   }
    // });

    this.loadDriveFromServer();
    this.leftSideDriveDirectory();
  }

  public myDrives: {
    sizeInBytes: number;
    sizeInKB: number;
    drive: string;
  }[] = [];

  public dirCompRef!: ComponentRef<any>;

  public mymodel!: string;

  public searchedThroughDirResult: any[] = [];

  //serach recusively
  public async valuechange(ev: any) {
    let value = ev.target.value;

    let _myInfo = myInfo;
    let dirPath =
      this._explorerDirInfoService.explorerDirInfoMap[this.driveCompId];

    let allInfo = {
      path: dirPath,
      myInfo: _myInfo,
      value,
    };

    this._ws.socket.emit('searchThroughDir', allInfo);

    this._ws
      .onMessage('searchThroughDirRes')
      .pipe(take(1))
      .subscribe((res) => {
        // console.log(res);
        this.searchedThroughDirResult = res;
      });
  }

  public async loadDriveFromServer() {
    //
    const clientInfo = myInfo;
    this._ws.socket.emit('loadDriveFromServer', clientInfo);

    this._ws
      .onMessage('loadDriveFromServerRes')
      .pipe(take(1))
      .subscribe((res) => {
        this.myDrives = res;
      });
  }

  public async openDrive(driveInfo: directoryInfoType): Promise<void> {
    //emprty the next pointer to go to next dir as we clicked on different dir so, history renewed
    this.visitedPathHistoryTrack = [];
    //pushing new dirs which is visited just
    this.directoryPathVisited.push(driveInfo);
    // rxjs change detector on dir paths
    // this.directoryPathVisitedSubject.next(this.directoryPathVisited);
    const _dirInfo = this.directoryPathVisited;
    let dirInfoWithUserInfo = {
      dirInfo: _dirInfo,
      userInfo: myInfo,
    };

    this.createDirectoryComponent(dirInfoWithUserInfo);

    // this.driveDirViewRef.clear();
    // this.driveDirViewRef.createComponent(comp.DirectoryComponent);
  }

  public async createDirectoryComponent(dirInfoWithUserInfo: any) {
    let comp = await import('../directory/directory.component');

    this.driveDirViewRef.clear();
    let dirCompRef = this.driveDirViewRef.createComponent(
      comp.DirectoryComponent
    ) as ComponentRef<any>;

    this.dirCompRef = dirCompRef;

    //provide some msg/template through instance
    dirCompRef.instance.myDirectoryPathVisited = this.directoryPathVisited;
    //also provide subject so that we can do next in the created compoenent (child)
    dirCompRef.instance.mydirectoryPathVisitedSubject =
      this.directoryPathVisitedSubject;

    //in our case drive is the exploer id
    dirCompRef.instance.myCompId = this.driveCompId;
    //
    dirCompRef.instance.dirInfoWithUserInfo = dirInfoWithUserInfo;
    //
    this.directoryMode = true;

    this._ws.socket.emit('directoryChange', dirInfoWithUserInfo);

    //take (1) to make sure it should emit one means one explorer change dir not effect other explorer dir
    this._ws
      .onMessage('directoryChangeRes')
      .pipe(take(1))
      .subscribe((filesArr) => {
        dirCompRef.instance.dirInfo = filesArr;
      });
  }

  public backDir(): void {
    this.visitedPathHistoryTrack.push(
      this.directoryPathVisited.pop() as directoryInfoType
    );

    // after popping dir means going back to dir
    //1 means at root-dir we are on so, drive view should be visible
    if (this.directoryPathVisited.length == 1) {
      this.directoryMode = false;
      this.driveDirViewRef.clear();
    }

    //fire event to rxjs change detector on dir paths
    // this.directoryPathVisitedSubject.next(this.directoryPathVisited);
    const _dirInfo = this.directoryPathVisited;
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
        this.dirCompRef.instance.dirInfo = filesArr;
      });

    //call the directory info api to display data
  }

  public nextDir(): void {
    this.directoryPathVisited.push(
      this.visitedPathHistoryTrack.pop() as directoryInfoType
    );

    //fire event to rxjs change detector on dir paths
    // this.directoryPathVisitedSubject.next(this.directoryPathVisited);
    const _dirInfo = this.directoryPathVisited;
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
        this.dirCompRef.instance.dirInfo = filesArr;
      });

    //again show directory mode if next dir btn is called
    this.createDirectoryComponent(dirInfoWithUserInfo);

    //call the directory info api to display data
  }

  //works for current host component.html and component.ts
  @ViewChildren('caret') carets!: QueryList<ElementRef>;

  public leftSideDriveDirectory() {
    this.carets.forEach((caret: any) => {
      caret.nativeElement.addEventListener('click', function (this: any) {
        this.parentElement.querySelector('.nested').classList.toggle('active');
        this.classList.toggle('caret-down');
      });
    });
  }
}
