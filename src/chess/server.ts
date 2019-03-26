import '../multiturn/helper/loglevel-prefix-name';

import * as log from 'loglevel';

// Set the proper level before all of the other imports
log.setLevel(log.levels.WARN);

import * as express from 'express';
import * as http from 'http';
import * as httpshutdown from 'http-shutdown';
import * as socketio from 'socket.io';
import { fillDefault, makeDefaultWithRefresh } from '../multiturn/game/default';
import Server from '../multiturn/game/server';
import Board from './board';
import runner from './game';
import Remote from './remote';

function main() {
  const app = express();

  const clientPath = `${__dirname}/../../dist`;
  app.use(express.static(clientPath));

  const unwrappedServer = http.createServer(app);
  const server = httpshutdown(unwrappedServer);

  const io = socketio(server);

  const mux = makeDefaultWithRefresh({
    typePath: './src/chess/game.ts',
    cacheTypes: true,
  }, io, (options) => {
    const gameServer = new Server<Remote, Board>(
      runner, Remote, Board, options);
    gameServer.start().then(() => {
      log.info('Closing instance of server.');
    });
  });
  mux.listen();

  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    log.info('Server started on ' + port);
  });
}

main();
