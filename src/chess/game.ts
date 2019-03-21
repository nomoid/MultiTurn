import Server from '../multiturn/game/server';
import Board from './board';
import Move from './move';
import Remote from './remote-dev';
import { Color, Coordinate, coordToString, numToColor, opponent } from './rules';

import * as log from 'loglevel';

function start(move: Move): Coordinate {
  return [move.startFile, move.startRank];
}

function end(move: Move): Coordinate {
  return [move.endFile, move.endRank];
}

function colorToNum(color: Color): number {
  if (color === 'white') {
    return 1;
  }
  else {
    return 2;
  }
}

export default function getRunner(board: Board) {
  return async (game: Server<Remote, Board>) => {
    const player = game.getCurrentPlayer();
    const color = numToColor(player.num);
    if (board.getAllValidMoves(color).length === 0) {
      if (board.isInCheck(color)) {
        game.gameOver(colorToNum(opponent(numToColor(player.num))).toString());
      }
      else {
        game.gameOver((0).toString());
      }
    }
    const validator = (possibleMove: Move) =>
      board.tryMove(numToColor(player.num),
        start(possibleMove),
        end(possibleMove));
    let move: Move;
    do {
      move = await player.remote.getMove();
    } while (!validator(move));
    log.info(`${numToColor(player.num)} made move`
    + ` ${coordToString(start(move))}`
    + ` to ${coordToString(end(move))}`);
  };
}
