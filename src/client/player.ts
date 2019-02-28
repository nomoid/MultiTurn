import { remote } from '../multiturn/remote/remote';
import Move from '../server/tictactoe/move';

function randomMove(): Move {
  const x = Math.floor(Math.random() * 3);
  const y = Math.floor(Math.random() * 3);
  return new Move(x, y);
}

export default class Player {

  public constructor() {
    // TODO
  }

  @remote(Move)
  public getMove(): Promise<Move> {
    console.log('Calculating...');
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const move = randomMove();
        console.log(`Move: ${JSON.stringify(move)}`);
        resolve(move);
      }, 1000);
    });
  }
}
