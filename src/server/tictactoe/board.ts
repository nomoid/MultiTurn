import Move from '../move';

const rows = 3;
const cols = 3;

export default class Board {
  /**
   * The spaces of the board, represented in a two-dimensional array
   * The first coordinate is the x coordinate
   * The second coordinate is the y coordinate
   * A value of -1 indicates unoccupied
   * A nonnegative value indiciates occupied by the specified player
   * Strict validation is not needed because the client never passes an
   * instance to the server
   */
  public spaces: number[][];

  public constructor() {
    const spaces: number[][] = [];
    this.spaces = spaces;
    for (let i = 0; i < cols; i++) {
      const col: number[] = [];
      spaces.push(col);
      for (let j = 0; j < rows; j++) {
        col.push(-1);
      }
    }
  }

  public occupied(move: Move) {
    return this.spaces[move.x][move.y] !== 0;
  }

  public occupy(move: Move, n: number) {
    this.spaces[move.x][move.y] = n;
  }

  public checkVictory() {
    let arr: number[];
    const lines: number[][] = [];
    const spaces = this.spaces;
    // Check rows
    for (let i = 0; i < rows; i++) {
        arr = [];
        for (let j = 0; j < cols; j++) {
            const player = spaces[j][i];
            arr.push(player);
        }
        lines.push(arr);
    }
    // Check columns
    for (let i = 0; i < cols; i++) {
        arr = [];
        for (let j = 0; j < rows; j++) {
            const player = spaces[i][j];
            arr.push(player);
        }
        lines.push(arr);
    }
    // Check diagonals
    arr = [];
    for (let i = 0; i < rows; i++) {
        const player = spaces[i][i];
        arr.push(player);
    }
    lines.push(arr);
    arr = [];
    for (let i = 0; i < rows; i++) {
        const player = spaces[cols - i][i];
        arr.push(player);
    }
    lines.push(arr);
    // Returns the number if all numbers are the same for a given line
    for (const line of lines) {
        let match = true;
        const v = line[0];
        for (let j = 1; j < line.length; j++) {
            if (line[j] !== v) {
                match = false;
                break;
            }
        }
        if (match && v >= 0) {
            return v;
        }
    }
    return -1;
  }
}
