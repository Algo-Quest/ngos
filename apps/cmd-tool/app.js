// // client.js

// // index.js
const express = require('express');
const http = require('http');
const ioClient = require('socket.io-client');
require('dotenv').config();
const { spawn } = require('child_process');
const executablePath = 'mouse-pos.exe';

const socketClient = ioClient(
  process.env.SOCKET_URL || 'http://localhost:3000'
);

let email = 'cl.aniketraj@gmail.com';
let clientInfo = {};

// *****  works as a socket client like chrome browser

// Event listener for connection
socketClient.on('connect', (_socket) => {
  console.log('Connected to the Socket.io server');
  //get the creds from server databse and clientALlInfo
  socketClient.emit('getClientInfoFromCmdTool', { email });
});

socketClient.on('getClientInfoFromCmdToolRes', (message) => {
  //from database
  console.log(socketClient.id);

  socketClient.emit('setCmdToolClientIdInDB', {
    reqEmail: email,
    socketId: socketClient.id,
  });
});

socketClient.on('setCmdToolClientIdInDBRes', (res) => {
  // console.log(res);
});

socketClient.on('mouseChangeEventCmdEmit', (ev) => {
  const args = [ev.x, ev.y];
  console.log(ev);
  const childProcess = spawn(executablePath, args);
});

// Event listener for disconnection
socketClient.on('disconnect', () => {
  console.log('Disconnected from the Socket.io server');
});
