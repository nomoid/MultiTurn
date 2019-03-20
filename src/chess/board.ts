import * as logger from 'loglevel';
import { Coordinate, setupDefault, Space, potentialMoves, Color, frontSpace,
  isValidSpace, diagonalSpaces, coordEq, coordToString } from './rules';

const log = logger.getLogger('Chess');
log.setLevel(logger.levels.INFO);

export default class Board {

  // e.g. d1 corresponds to spaces[3][0]
  public spaces: Space[][] = [];

  public constructor() {
    setupDefault(this.spaces);
  }

  public space([file, rank]: Coordinate) {
    return this.spaces[file][rank];
  }

  // Returns: whether the move has been made or not
  public makeMove(player: Color, start: Coordinate, end: Coordinate): boolean {
    log.debug(`${player} is attempting to make move`
      + ` ${coordToString(start)}`
      + ` to ${coordToString(end)}`);
    const [startFile, startRank] = start;
    const [endFile, endRank] = end;
    const occupant = this.space(start);
    if (!occupant) {
      log.debug('Move failed because the starting space was not occupied!');
      return false;
    }
    const [color, piece] = occupant;
    if (color !== player) {
      log.debug('Move failed because starting space\'s piece was owned by a'
        + ' different player!');
      return false;
    }
    const moves = this.getValidMoves(start);
    let found = false;
    for (const move of moves) {
      if (coordEq(move, end)) {
        found = true;
        break;
      }
    }
    if (!found) {
      log.debug('Move failed because the ending coordinate was not found as'
        + ' a valid move');
      return false;
    }
    // Make the move
    this.spaces[startFile][startRank] = '';
    this.spaces[endFile][endRank] = occupant;
    // TODO deal with en passant and promotion
    log.debug('Move succeeded');
    return true;
  }

  public getAllValidMoves(player: Color): Array<[Coordinate, Coordinate]> {
    const allMoves: Array<[Coordinate, Coordinate]> = [];
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const occupant = this.spaces[file][rank];
        if (!occupant) {
          continue;
        }
        const [color, piece] = occupant;
        if (color !== player) {
          continue;
        }
        const coord: Coordinate = [file, rank];
        const moves = this.getValidMoves(coord);
        const coordMoves: Array<[Coordinate, Coordinate]>
          = moves.map((move) => [coord, move] as [Coordinate, Coordinate]);
        allMoves.push(...coordMoves);
      }
    }
    return allMoves;
  }

  public getValidMoves(coord: Coordinate): Coordinate[] {
    // TODO consider checking
    const [file, rank] = coord;
    const occupant = this.space(coord);
    if (!occupant) {
      log.debug('No valid moves because the space was not occupied');
      return [];
    }
    const [color, piece] = occupant;
    const moves: Coordinate[][] = [];
    // Get the set of potential moves based on piece
    if (piece !== 'pawn') {
      moves.push(...potentialMoves(piece, coord));
    }
    // Handle pawn separately since it depends on the current board state
    else {
      const pawnSubarray = [frontSpace(coord, color, 1)];
      // Check if pawn is at starting location
      if (color === 'white' && rank === 1 || color === 'black' && rank === 6) {
        pawnSubarray.push(frontSpace(coord, color, 2));
      }
      moves.push(pawnSubarray);
      // Check if diagonal front contains enemy piece
      const diagonals = diagonalSpaces(coord, color);
      for (const diagonal of diagonals) {
        if (isValidSpace(diagonal)) {
          const diagonalOccupant = this.space(diagonal);
          if (diagonalOccupant) {
            if (diagonalOccupant[0] !== color) {
              moves.push([diagonal]);
            }
          }
        }
      }
    }
    const indivMoves: Coordinate[] = [];
    // Check for blocking
    for (const subarray of moves) {
      for (const move of subarray) {
        if (!isValidSpace(move)) {
          break;
        }
        const moveOccupant = this.space(move);
        if (!moveOccupant) {
          indivMoves.push(move);
          continue;
        }
        const [moveColor, movePiece] = moveOccupant;
        // Ally piece
        if (moveColor === color) {
          break;
        }
        // Enemy piece
        else {
          indivMoves.push(move);
          break;
        }
      }
    }
    // TODO Check for castling condition
    return indivMoves;
  }
}
