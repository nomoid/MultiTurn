import Server from '../multiturn/game/server';
import Move from '../tictactoe/move';
import Board from './board';
import Remote from './remote';

export default function getRunner(state: Board) {
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
      return;
    }
    const full = board.checkFull();
    if (full) {
      game.gameOver((-1).toString());
    }
  };
}
