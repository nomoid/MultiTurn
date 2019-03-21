import Server from '../multiturn/game/server';
import Board from './board';
import Move from './move';
import Remote from './remote-dev';
import { Color, Coordinate, coordToString, numToColor, opponent } from './rules';

import * as log from 'loglevel';

export default function getRunner(board: Board) {
  return async (game: Server<Remote, Board>) => {
    const player = game.getCurrentPlayer();
    const color = numToColor(player.num);
    if (board.getAllValidMoves(color).length === 0) {
      if (board.isInCheck(color)) {
        game.gameOver(opponentNum(player.num).toString());
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

function start(move: Move): Coordinate {
  return [move.startFile, move.startRank];
}

function end(move: Move): Coordinate {
  return [move.endFile, move.endRank];
}

function opponentNum(num: number): number {
  if (num === 1) {
    return 2;
  }
  else {
    return 1;
  }
}
