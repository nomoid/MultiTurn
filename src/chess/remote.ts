import DefaultClient from '../multiturn/game/defaultclient';
import { remote } from '../multiturn/remote/remote';
import Board from './board';
import Move from './move';
import { numToColor, Coordinate, coordEq, Color } from './rules';

export default class Remote extends DefaultClient<Remote, Board, Move> {

  @remote(Move)
  public getMove(): Promise<Move> {
    return new Promise((resolve, reject) => {
      // Wait for a button to be pressed
      this.latestMoveResolver = resolve;
    });
  }

  public getRemote(): Remote {
    return this;
  }

  public getValidMoves(coord: Coordinate): Coordinate[] {
    return this.getState().getValidMoves(coord);
  }

  public isValidMove(start: Coordinate, end: Coordinate): boolean {
    const validMoves = this.getState().getValidMoves(start);
    for (const move of validMoves) {
      if (coordEq(move, end)) {
        return true;
      }
    }
    return false;
  }

  public hasOwnPiece(coord: Coordinate): boolean {
    const occupant = this.getState().space(coord);
    if (!occupant) {
      return false;
    }
    const [color, piece] = occupant;
    return color === this.getColor();
  }

  public getColor(): Color {
    return numToColor(this.getPlayerNum());
  }

  protected bindPrototype(s: Board): void {
    Object.setPrototypeOf(s, Board.prototype);
  }

  protected numToString(num: number): string {
    return numToColor(num);
  }
}
