import Move from '../move';
import { remote } from './validator';

export default class Player {

  @remote()
  public getMove(): Move {
    return new Move(1, 1);
  }

  @remote(Move)
  public getDelayedMove(): Promise<Move> {
    return Promise.resolve(new Move(1, 1));
  }
}
