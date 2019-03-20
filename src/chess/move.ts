import { Coordinate } from './rules';

export default class Move {

  /**
   * The file of the source of the move.
   * @minimum 0
   * @maximum 7
   * @TJS-type integer
   */
  public startFile: number;

  /**
   * The rank of the source of the move.
   * @minimum 0
   * @maximum 7
   * @TJS-type integer
   */
  public startRank: number;

  /**
   * The file of the destination of the move.
   * @minimum 0
   * @maximum 7
   * @TJS-type integer
   */
  public endFile: number;

  /**
   * The rank of the destination of the move.
   * @minimum 0
   * @maximum 7
   * @TJS-type integer
   */
  public endRank: number;

  public constructor(startFile: number, startRank: number,
      endFile: number, endRank: number) {
    this.startFile = startFile;
    this.startRank = startRank;
    this.endFile = endFile;
    this.endRank = endRank;
  }
}
