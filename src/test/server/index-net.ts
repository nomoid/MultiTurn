import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import SIOServerNetworkLayer from '../../multiturn/sio-network/server/layer';

const app = express();

const clientPath = `${__dirname}/../../dist`;
app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

io.on('connection', (socket) => {
  console.log('Player joined');
});

let i = 0;

const netLayer = new SIOServerNetworkLayer(io);
netLayer.addConnectionListener((e) => {
  const sock = e.accept();
  sock.addRequestListener((e2) => {
    console.log(`Key: ${e2.key}, Message: ${e2.message}`);
    e2.respond(`response ${i}`);
    i += 1;
  });
});
netLayer.listen();

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log('Server started on ' + port);
});
