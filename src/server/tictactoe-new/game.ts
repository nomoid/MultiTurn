import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import { fillDefault } from '../../multiturn/game/default';
import Server from '../../multiturn/game/server';
import Move from '../tictactoe/move';
import Board from './board';
import Remote from './remote';

function getRunner(state: Board) {
  return async function runner(game: Server<Remote, Board>): Promise<void> {
    const player = game.getCurrentPlayer();
    const board = state;
    const validator = (possibleMove: Move) => !board.occupied(possibleMove);
    let move;
    do {
      move = await player.remote.getMove();
    } while (!validator(move));
    console.log(`Valid move: {${move.x}, ${move.y}}`);
    board.occupy(move, player.num);
    const win = board.checkVictory();
    if (win >= 0) {
      game.gameOver(player.num.toString());
    }
  };
}

export default function main() {
  const app = express();

  const clientPath = `${__dirname}/../../../dist`;
  app.use(express.static(clientPath));

  const server = http.createServer(app);

  const io = socketio(server);

  const options = fillDefault({
    typePath: './src/server/tictactoe-new/game.ts'
  }, io);
  const state = new Board();
  const gameServer = new Server<Remote, Board>(
    getRunner(state), Remote, state, options);
  gameServer.start();

  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log('Server started on ' + port);
  });

}
