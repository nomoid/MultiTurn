import { Client } from '../../multiturn/game/client';
import { CombinedInfo } from '../../multiturn/game/info';
import { remote } from '../../multiturn/remote/remote';
import { ClientSyncStateEvent } from '../../multiturn/sync/client';
import Board from '../board';
import Move from '../move';
import { Color, numToColor } from '../rules';

export default class Remote implements Client<Remote> {

  private board!: Board;
  private color!: Color;

  @remote(Move)
  public getMove(): Promise<Move> {
    return new Promise((resolve, response) => {
      setTimeout(() => resolve(this.randomMove()), 1000);
    });
  }

  public updateState(e: ClientSyncStateEvent, info: CombinedInfo): void {
    console.log(`Updating state ${e.state}, ${JSON.stringify(info)}`);
    this.board = JSON.parse(e.state) as Board;
    Object.setPrototypeOf(this.board, Board.prototype);
    this.color = numToColor(info.num);
  }

  public getRemote(): Remote {
    return this;
  }

  private randomMove(): Move {
    const moves = this.board.getAllValidMoves(this.color);
    if (moves.length === 0) {
      throw new Error('No valid moves remain!');
    }
    const randomIndex = Math.floor(Math.random() * moves.length);
    const randomMove = moves[randomIndex];
    return new Move(randomMove[0][0], randomMove[0][1],
      randomMove[1][0], randomMove[1][1]);
  }

}
