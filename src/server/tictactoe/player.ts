import { remote } from '../new-remote/validator';
import Move from './move';

function randomMove(): Move {
  const x = Math.floor(Math.random() * 3);
  const y = Math.floor(Math.random() * 3);
  return new Move(x, y);
}

export default class Player {
  @remote(Move)
  public getMove(): Promise<Move> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(randomMove());
      }, 1000);
    });
  }
}
