import * as express from 'express';
import * as http from 'http';
import * as Bundler from 'parcel-bundler';
import * as socketio from 'socket.io';
import SIONetworkLayer from '../multiturn/sio-network/layer';

const app = express();

const bundler = new Bundler();

const clientPath = `${__dirname}/../../build`;
app.use(express.static(clientPath));

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

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log('Server started on ' + port);
});
