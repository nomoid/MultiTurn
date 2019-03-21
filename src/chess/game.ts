import Server from '../multiturn/game/server';
import Board from './board';
import Move from './move';
import Remote from './remote-dev';
import { Color, Coordinate, coordToString, numToColor } from './rules';

import * as log from 'loglevel';

function start(move: Move): Coordinate {
  return [move.startFile, move.startRank];
}

function end(move: Move): Coordinate {
  return [move.endFile, move.endRank];
}

export default function getRunner(board: Board) {
  return async (game: Server<Remote, Board>) => {
    const player = game.getCurrentPlayer();
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
