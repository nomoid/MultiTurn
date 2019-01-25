export default class Move {
  /**
   * The x-coordinate of the move.
   * @minimum 0
   * @maximum 2
   * @TJS-type integer
   */
  public x: number;

  /**
   * The y-coordinate of the move.
   * @minimum 0
   * @maximum 2
   * @TJS-type integer
   */
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
