import { remote } from '../../multiturn/remote/remote';
import Move from './move';

export default class Remote {

  @remote(Move)
  public getMove(): Promise<Move> {
    return Promise.resolve(new Move(1, 1));
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
