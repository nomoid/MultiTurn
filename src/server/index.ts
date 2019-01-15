import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import SIONetworkLayer from '../multiturn/sio-network/layer';

const app = express();

const server = http.createServer(app);
const io = socketio(server);

let i = 0;

const netLayer = new SIONetworkLayer(io);
netLayer.addConnectionListener((e) => {
  const sock = e.accept();
  sock.addRequestListener((e2) => {
    console.log(`Key: ${e2.key}, Message: ${e2.message}`);
    e2.respond(`response ${i}`);
    i += 1;
  });
});
