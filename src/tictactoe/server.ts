import '../multiturn/helper/loglevel-prefix-name';

import * as log from 'loglevel';

// Set the proper level before all of the other imports
log.setLevel(log.levels.DEBUG);

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
    typePath: './src/tictactoe/game.ts',
    cacheTypes: true
  }, io);
  const state = new Board();
  const gameServer = new Server<Remote, Board>(
    getRunner(state), Remote, state, options);
  gameServer.start().then(() => {
    log.info('Closing server.');
    server.close();
  });

  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    log.info('Server started on ' + port);
  });
}

main();
