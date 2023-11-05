import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { Socket } from 'socket.io';
import fsExtra from 'fs-extra';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repository/user';
import { Injectable } from '@nestjs/common';
import { RemoteSession } from '../model/remote-session';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { getFolderSize } from '../helper/folder-size';
import { searchDirectory } from '../helper/search-dir';

@WebSocketGateway(/*3001, {
  cors: '*',
}*/)
@Injectable()
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(
    private readonly _configService: ConfigService,
    private readonly _userRepository: UserRepository,
    private readonly _jwtService: JwtService,
    @InjectModel(RemoteSession.name)
    public remoteSession: Model<RemoteSession>
  ) {}

  afterInit(server: Server) {
    //path.join(path.resolve(),'apps');
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: any, ...args: any[]) {
    this.connectedClients.set(client.id, client);
    // console.log(`Client connected: ${client.id}`);
    console.log('Connected Clients:', Array.from(this.connectedClients.keys()));

    const targetClient = this.connectedClients.get(client.id);
    if (targetClient) targetClient.emit('clientId', client.id);
  }

  handleDisconnect(client: any) {
    this.connectedClients.delete(client.id);
    // console.log(`Client disconnected: ${client.id}`);
  }

  // Example of broadcasting a message to all connected clients
  broadcastMessage(message: string) {
    this.server.emit('message', message);
  }

  @SubscribeMessage('searchThroughDir')
  public async searchThroughDir(client: Socket, message) {
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    let rootDir = message.path?.shift();

    if (message.path?.length == 0) {
      console.log('first');
      let _pathRoot = path.join(
        dest,
        message.myInfo.email?.split('@')[0],
        'DRIVE'
      );
      let result = searchDirectory(_pathRoot, message.value);

      // console.log(result);

      client.emit('searchThroughDirRes', result);
      return;
    }

    const newPath = message.path;
    let constructPath = newPath?.map((p) => p.name);

    const _path = path.join(dest, message.myInfo.email?.split('@')[0], 'DRIVE');

    const fileOpeningPath = path.join(_path, ...constructPath);
  }

  @SubscribeMessage('openFile')
  public async openFile(client: Socket, message) {
    //
    // myInfo: { email: 'cl.aniketraj@gmail.com', username: 'cl.aniketraj' },
    // dirInfo: {
    //   name: 'server.js',
    //   isFile: true,
    //   isDir: false,
    //   stats: {

    //   }
    // },
    // path: [
    //   { type: 'root-drive', id: 'THIS_PC', name: 'This PC' },
    //   { type: 'drive', id: 'USER', name: 'USER' }
    // ]
    message.path?.shift();
    const newPath = message.path;
    let constructPath = newPath?.map((p) => p.name);

    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    const _path = path.join(dest, message.myInfo.email?.split('@')[0], 'DRIVE');

    const fileOpeningPath = path.join(_path, ...constructPath);
    // console.log(path.join(_path, ...constructPath));

    try {
      let fileData = fs.readFileSync(
        path.join(fileOpeningPath, message.dirInfo.name),
        'utf-8'
      );
      client.emit('openFileRes', fileData);
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage('createFile')
  public async createFile(client: Socket, message) {
    //
    message.path?.shift();
    const newPath = message.path;
    let constructPath = newPath?.map((p) => p.name);

    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    const _path = path.join(dest, message.email?.split('@')[0], 'DRIVE');

    let dirs = fs.readdirSync(path.join(_path, ...constructPath));
    let serverFolderName = dirs.find((n) => n == 'New File');
    //if no new folder then
    if (!serverFolderName) {
      const info = {
        dirPath: path.join(_path, ...constructPath, 'New File'),
        email: message?.email,
        fileName: 'New File',
      };

      try {
        const idToDetectNewFile = info.fileName;
        fs.writeFileSync(info.dirPath, '');
        client.emit('createFileRes', idToDetectNewFile);
      } catch {
        return;
      }

      return;
    }

    //if new folder name exists then
    let matchingElements = dirs.filter((element) =>
      element.includes('New File (')
    );

    let newCount: number;
    if (matchingElements.length > 0) {
      let numberOfLastCreatedFolder = [];

      matchingElements.forEach((n) =>
        numberOfLastCreatedFolder.push(n.match(/\(\s*(\d+)\s*\)/)[1])
      );

      newCount = Math.max(...numberOfLastCreatedFolder) + 1;
    } else {
      newCount = 1;
    }

    const info = {
      dirPath: path.join(
        _path,
        ...constructPath,
        'New File ( ' + newCount + ' )'
      ),
      email: message?.email,
      fileName: 'New File ( ' + newCount + ' )',
    };

    try {
      const idToDetectNewFile = info.fileName;
      fs.writeFileSync(info.dirPath, '');
      client.emit('createFileRes', idToDetectNewFile);
    } catch {}
  }

  @SubscribeMessage('directoryFolderCreated')
  public async directoryFolderCreated(client: Socket, message) {
    //
    message.path?.shift();
    const newPath = message.path;
    let constructPath = newPath?.map((p) => p.name);

    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    const _path = path.join(dest, message.email?.split('@')[0], 'DRIVE');

    let dirs = fs.readdirSync(path.join(_path, ...constructPath));
    let serverFolderName = dirs.find((n) => n == 'New Folder');
    //if no new folder then
    if (!serverFolderName) {
      const info = {
        dirPath: path.join(...constructPath),
        email: message?.email,
        mkdirName: 'New Folder',
      };

      try {
        this.mkdir(client, info);
        client.emit('directoryFolderCreatedRes');
      } catch {
        return;
      }

      return;
    }

    //if new folder name exists then
    let matchingElements = dirs.filter((element) =>
      element.includes('New Folder (')
    );

    let newCount: number;
    if (matchingElements.length > 0) {
      let numberOfLastCreatedFolder = [];

      matchingElements.forEach((n) =>
        numberOfLastCreatedFolder.push(n.match(/\(\s*(\d+)\s*\)/)[1])
      );

      newCount = Math.max(...numberOfLastCreatedFolder) + 1;
    } else {
      newCount = 1;
    }

    const info = {
      dirPath: path.join(...constructPath),
      email: message?.email,
      mkdirName: 'New Folder ( ' + newCount + ' )',
    };

    try {
      this.mkdir(client, info);
      client.emit('directoryFolderCreatedRes');
    } catch {}
  }

  @SubscribeMessage('directoryChange')
  public async directoryChange(client: Socket, message) {
    // Below is the message response
    // {
    //   dirInfo: [
    //     { type: 'root-drive', id: 'THIS_PC', name: 'This PC' },
    //     { type: 'drive', id: 'PC', name: 'PC' },
    //     { name: 'okok', isDir: true, isFile: false, stats: [Object] }
    //   ],
    //   userInfo: { email: 'cl.aniketraj@gmail.com', username: 'cl.aniketraj' }
    // }
    //For now omit First Path As It Is For FrontEnd Use
    message.dirInfo?.shift();
    let pathArr = message?.dirInfo?.map((_dirInfo) => _dirInfo.name);

    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    const _path = path.join(
      dest,
      message.userInfo.email?.split('@')[0],
      'DRIVE'
    );

    //... for path arr trick
    const finalPath = path.join(_path, ...pathArr);

    let files = fs.readdirSync(finalPath);

    let fileArray = [];

    files.forEach((file) => {
      const filePath = path.join(finalPath, file);
      // Get file stats
      let stats = fs.statSync(filePath);

      if (stats.isFile())
        fileArray.push({
          name: path.basename(filePath),
          isFile: stats.isFile(),
          isDir: false,
          stats,
        });
      else
        fileArray.push({
          name: file,
          isDir: stats.isDirectory(),
          isFile: false,
          stats,
        });
    });

    // Custom sort function to prioritize directories over files
    fileArray.sort((a, b) => {
      // Directories come first
      if (a.isDir && !b.isDir) {
        return -1;
      }
      // Files come later
      if (!a.isDir && b.isDir) {
        return 1;
      }
      // Sort alphabetically within the same type
      return a.name.localeCompare(b.name);
    });

    client.emit('directoryChangeRes', fileArray);
  }

  @SubscribeMessage('loadDriveFromServer')
  async loadDriveFromServer(
    client: Socket,
    message: { clientInfo?: object; email: string }
  ) {
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    const finalPath = path.join(dest, message.email?.split('@')[0], 'DRIVE');

    const userDrives = fs.readdirSync(finalPath);

    let finalUserDriveWithInfo: {
      sizeInBytes: number;
      sizeinKB: number;
      drive: string;
    }[] = [];

    //drive is also called as folder
    userDrives.forEach((drive) => {
      let drivePath = path.join(finalPath, drive);

      let _getFolderSize = getFolderSize(drivePath) as unknown as {
        sizeInBytes: number;
        sizeinKB: number;
        drive: string;
      };
      _getFolderSize.drive = drive;
      finalUserDriveWithInfo.push(_getFolderSize);
    });

    // console.log(finalUserDriveWithInfo);

    client.emit('loadDriveFromServerRes', finalUserDriveWithInfo);
  }

  @SubscribeMessage('setCmdToolClientIdInDB')
  public async setCmdToolClientIdInDB(client: Socket, message: any) {
    const result = await this.remoteSession.updateOne(
      {
        'info.message.reqEmail': message.reqEmail,
      },
      {
        'info.cmdToolClientId': message.socketId,
      }
    );

    client.emit('setCmdToolClientIdInDBRes', result);
  }

  @SubscribeMessage('getClientInfoFromCmdTool')
  public async getClientInfoFromCmdTool(client: Socket, message: any) {
    const result = await this.remoteSession.findOne({
      'info.message.reqEmail': message.email,
    });

    client.emit('getClientInfoFromCmdToolRes', result);
  }

  @SubscribeMessage('emit-my-tool-client-id')
  public async emitMyToolClientId(client: Socket, message) {
    client.emit('emit-my-tool-client-id-res', client.id);
  }

  @SubscribeMessage('remoteAccessTrue')
  public async remoteAccessTrue(client: Socket, message) {
    let nextUser = this.connectedClients.get(message.message.uid);

    const result = (await this.remoteSession.findOne({
      'info.message.myid': message.message.myid,
    })) as any;

    message.message.cmdToolClientId = result.info.cmdToolClientId;

    if (!message.message.cmdToolClientId) {
      client.emit('no-cmd-tool-client-found');
    }

    nextUser?.emit('remoteAccessTrueRes', message);
  }

  @SubscribeMessage('mouseChangeEventEmit')
  public async mouseChangeEventEmit(client: Socket, message) {
    console.log(message);
    let cmd = this.connectedClients.get(message.cmdToolClientId);

    cmd?.emit('mouseChangeEventCmdEmit', message);
  }

  @SubscribeMessage('ngShareCallOffer')
  public async ngShareCallOffer(client: Socket, offerInfo: any) {
    let nextUser = this.connectedClients.get(offerInfo.message.uid);

    // console.log(nextUser);

    nextUser.emit('ngShareCallOfferRes', offerInfo);
  }

  @SubscribeMessage('ngShareCallAnswer')
  public async ngShareCallAnswer(client: Socket, answerInfo: any) {
    //this is the client window who sends the call
    let myUser = this.connectedClients.get(answerInfo.message.myid);
    // console.log(nextUser);

    //this is the window who receives the caller like receiver screen client will have this emission
    myUser.emit('ngShareCallAnswerRes', answerInfo);

    //just to close caller screen
    myUser.emit('ngShareCallAnswerResCloseCallerScreen');

    await this.remoteSession.updateOne(
      { 'info.message.reqEmail': answerInfo.message.reqEmail },
      {
        $set: {
          info: answerInfo,
        },
      },
      {
        upsert: true,
      }
    );
  }

  // public myClient;

  // //like socket.on('topic')
  // @SubscribeMessage('startConnect')
  // async startConnect(client: Socket, myOtherclientId: string) {
  //   // console.log(client.id);
  //   // let myClient = this.connectedClients.get(client.id);
  //   // client.emit('started', client.id);
  //   const t = this.connectedClients.get(client.id);
  //   if (t) t.emit('started', 'HELLO');
  // }

  //like socket.on('topic')
  @SubscribeMessage('getScid')
  async startConnect(client: Socket, myOtherclientId: string) {
    client.emit('getScidRes', client.id);
  }

  @SubscribeMessage('connectNgShare')
  async connectNgShare(
    client: Socket,
    message: { mediaStream: string; clientConnectedInfo: Object }
  ) {
    console.log(message);
  }

  @SubscribeMessage('suLs')
  async suLs(
    client: Socket,
    connectedClientInfo: {
      session: string;
      dirPath: string;
      message: {
        myid: string;
        uid: string;
        reqEmail: string;
        receivingEmail: string;
      };
    }
  ) {
    //receiving email is the user who is request to share his directory
    let getSuUserEmail = connectedClientInfo?.message?.receivingEmail;
    let dirPath = connectedClientInfo.dirPath;

    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    const finalPath = path.join(
      dest,
      getSuUserEmail.split('@')[0],
      'DRIVE',
      dirPath
    );
    let files = fs.readdirSync(finalPath);

    let fileArray = [];

    files.forEach((file) => {
      const filePath = path.join(finalPath, file);
      // Get file stats
      let stats = fs.statSync(filePath);

      if (stats.isFile())
        fileArray.push({
          name: path.basename(filePath),
          isFile: stats.isFile(),
          isDir: false,
          stats,
        });
      else
        fileArray.push({
          name: file,
          isDir: stats.isDirectory(),
          isFile: false,
          stats,
        });
    });

    client.emit('suLsRes', fileArray);
  }

  @SubscribeMessage('suMkdir')
  async suMkdir(
    client: Socket,
    connectedClientInfo: {
      session: string;
      dirPath: string;
      mkdirName: string;
      message: {
        myid: string;
        uid: string;
        reqEmail: string;
        receivingEmail: string;
      };
    }
  ) {
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    const finalPath = path.join(
      dest,
      connectedClientInfo?.message?.receivingEmail?.split('@')[0],
      'DRIVE',
      connectedClientInfo?.dirPath,
      connectedClientInfo?.mkdirName
    );

    const pathToBeUsedForMkdir = path.join(
      dest,
      connectedClientInfo?.message?.receivingEmail?.split('@')[0],
      'DRIVE',
      connectedClientInfo?.dirPath
    );

    if (
      fs
        .readdirSync(pathToBeUsedForMkdir)
        .find((e) => e == connectedClientInfo?.mkdirName)
    ) {
      return client.emit(
        'suMkdirRes',
        'A subdirectory or file pp already exists on session user (SU)!'
      );
    }

    try {
      fs.mkdirSync(finalPath);
      client.emit('suMkdirRes', false);
    } catch (err) {
      client.emit('suMkdirRes', err.message);
    }
  }

  @SubscribeMessage('createRemoteAccessSession')
  async createRemoteAccessSession(
    client: Socket,
    message: {
      myid: string;
      uid: string;
      reqEmail: string;
      receivingEmail: string;
    }
  ) {
    let isUserExist = this._userRepository.isUserExist(message.receivingEmail);

    if (!isUserExist) {
      return client.emit('unauthorizedAccess', 400);
    }
    let session = this._jwtService.sign({ session: true });

    let sessionUserArr = [message.myid, message.uid];

    sessionUserArr.forEach((id) => {
      this.connectedClients.get(id)?.emit('createRemoteAccessSessionRes', {
        session,
        message,
      });
    });
    //
  }

  //like socket.on('topic')
  @SubscribeMessage('connectToClient')
  async connectToClient(
    client: Socket,
    message: { myid: string; uid: string; reqEmail: string }
  ) {
    //to send msg to specific clients
    this.connectedClients.get(message.uid)?.emit('HELLO', message);

    /**
     *
     */
    // client.join('aroom');
    //Getting connected clinets ID
    // (this.server.sockets.sockets as unknown as Map<string, Socket>).forEach(
    //   (socket: Socket, socketId: string) => console.log(socketId)
    // )
    // const targetSocket = this.server.sockets.sockets.get(myOtherclientId);
    // this.server.to(myOtherclientId).emit('HELLO', 'HEELLO');
    // console.log(targetSocket);
    // console.log(targetClient);
    // const targetClient = this.connectedClients.get(myOtherclientId);
    // if (targetClient) targetClient.emit('HELLO', 'HELLO');
    // this.server.send(myOtherclientId).emit('HELLO', 'HELLO');
    // this.server.to(myOtherclientId).emit('HELLO', 'HELLO');
    // If you want to emit to all clients connected to the default namespace '/'
    // this.server.of('/').emit('HELLO', 'HELLO');
    // this.server.emit('HELLO', 'HELLO');
  }

  //like socket.on('topic')
  @SubscribeMessage('getCmdRootDir')
  async getCmdRootDir(client: Socket, message: string) {
    // console.log('called');

    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    let r = fs.readdirSync(path.join(dest, message.split('@')[0], 'DRIVE'));
    let f = r.find((n) => n == 'PC');
    // ****** this broadcats to all connected clients;
    // this.server.emit('getCmdRootDirRes', f);

    client.emit('getCmdRootDirRes', f);
  }

  // To send an Event to all connected clients
  @SubscribeMessage('ls')
  async ls(client: Socket, message: { dirPath: string; email: string }) {
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));
    const finalPath = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath
    );
    let files = fs.readdirSync(finalPath);

    let fileArray = [];

    files.forEach((file) => {
      const filePath = path.join(finalPath, file);
      // Get file stats
      let stats = fs.statSync(filePath);

      if (stats.isFile())
        fileArray.push({
          name: path.basename(filePath),
          isFile: stats.isFile(),
          isDir: false,
          stats,
        });
      else
        fileArray.push({
          name: file,
          isDir: stats.isDirectory(),
          isFile: false,
          stats,
        });
    });

    client.emit('lsRes', fileArray);
  }

  //like socket.on('topic')
  @SubscribeMessage('cd')
  async cd(
    client: Socket,
    message: { dirPath: string; email: string; cd: string }
  ) {
    // console.log('called');

    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    const finalPath = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath,
      message.cd
    );

    // console.log(message);

    const pathToBeSent = path.join(message.dirPath, message.cd);
    if (fs.existsSync(finalPath)) {
      client.emit('cdRes', pathToBeSent);
    } else {
      client.emit('cdRes', false);
    }
  }

  //like socket.on('topic')
  @SubscribeMessage('mkdir')
  async mkdir(
    client: Socket,
    message: { dirPath: string; email: string; mkdirName: string }
  ) {
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    const finalPath = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath,
      message.mkdirName
    );

    const pathToBeUsedForMkdir = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath
    );

    if (
      fs.readdirSync(pathToBeUsedForMkdir).find((e) => e == message.mkdirName)
    ) {
      return client.emit(
        'mkdirRes',
        'A subdirectory or file pp already exists.'
      );
    }

    try {
      fs.mkdirSync(finalPath);
      client.emit('mkdirRes', false);
    } catch (err) {
      client.emit('mkdirRes', err.message);
    }
  }

  //like socket.on('topic')
  @SubscribeMessage('rmdir')
  async rmdir(
    client: Socket,
    message: { dirPath: string; email: string; rmdirName: string }
  ) {
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    const finalPath = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath,
      message.rmdirName
    );

    const pathToBeUsedForRmdir = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath
    );

    if (
      !fs.readdirSync(pathToBeUsedForRmdir).find((e) => e == message.rmdirName)
    ) {
      return client.emit('rmdirRes', 'A subdirectory or file does not exist!.');
    }

    try {
      fs.rmdirSync(finalPath);
      client.emit('rmdirRes', false);
    } catch (err) {
      console.log(err);
      client.emit('rmdirRes', err.message);
    }
  }

  //like socket.on('topic')
  @SubscribeMessage('rmdirForce')
  async rmdirForce(
    client: Socket,
    message: { dirPath: string; email: string; rmdirName: string }
  ) {
    const fs_path_config = this._configService.get('FS_PATH_CONFIG');
    const dest = path.join(path.resolve(), ...eval(fs_path_config.fs_path));

    const finalPath = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath,
      message.rmdirName
    );

    const pathToBeUsedForRmdir = path.join(
      dest,
      message.email.split('@')[0],
      'DRIVE',
      message.dirPath
    );

    if (
      !fs.readdirSync(pathToBeUsedForRmdir).find((e) => e == message.rmdirName)
    ) {
      return client.emit(
        'rmdirForceRes',
        'A subdirectory or file does not exist!.'
      );
    }

    try {
      fsExtra.removeSync(finalPath);
      client.emit('rmdirForceRes', false);
    } catch (err) {
      client.emit('rmdirForceRes', err.message);
    }
  }
}
