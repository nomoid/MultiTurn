import Move from '../tictactoe/move';
import { remote } from './remote';

export default class Player {

  @remote()
  public getMove(): Move {
    return new Move(1, 1);
  }

  @remote(Move)
  public getDelayedMove(): Promise<Move> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(new Move(1, 0));
      }, 1000);
    });
  }
}
