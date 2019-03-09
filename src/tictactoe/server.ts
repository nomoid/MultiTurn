import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import { fillDefault } from '../multiturn/game/default';
import Server from '../multiturn/game/server';
import Board from './board';
import getRunner from './game';
import Remote from './remote';

function main() {
  const app = express();

  const clientPath = `${__dirname}/../../dist`;
  app.use(express.static(clientPath));

  const server = http.createServer(app);

  const io = socketio(server);

  const options = fillDefault({
    typePath: './src/tictactoe/game.ts'
  }, io);
  const state = new Board();
  const gameServer = new Server<Remote, Board>(
    getRunner(state), Remote, state, options);
  gameServer.start().then(() => {
    console.log('Closing server.');
    server.close();
  });

  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log('Server started on ' + port);
  });
}

main();
