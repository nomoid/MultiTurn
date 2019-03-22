import * as logger from 'loglevel';
import { generateUID } from '../multiturn/helper/uid';
import BoardCache from './cache';
import { Coordinate, setupDefault, Space, potentialMoves, Color, frontSpace,
  isValidSpace, diagonalSpaces, coordEq, coordToString, opponent,
  Piece, SpecialMove} from './rules';

const log = logger.getLogger('Chess');
log.setLevel(logger.levels.INFO);

export const boardCache: Map<string, BoardCache> = new Map();

export default class Board {

  // e.g. d1 corresponds to spaces[3][0]
  public spaces: Space[][] = [];
  public mostRecentMove?: MoveInfo;
  // Check if black/white rook/king has been moved
  // First array corresponds to black, second array corresponds to white
  // If rook moved, corresponding array index set to 0 (a rook 0, h rook 1)
  // If king moved, both array indices set to 0
  public canCastle: [[number, number], [number, number]] = [[1, 1], [1, 1]];
  public boardId: string;

  public constructor() {
    this.boardId = generateUID();
    setupDefault(this.spaces);
  }

  public space([file, rank]: Coordinate) {
    return this.spaces[file][rank];
  }

  // Returns: whether the move has been made or not
  public tryMove(player: Color, start: Coordinate, end: Coordinate): boolean {
    log.debug(`${player} is attempting to make move`
      + ` ${coordToString(start)}`
      + ` to ${coordToString(end)}`);
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
    this.move(start, end);
    if (this.getCache().enabled) {
      this.getCache().clearCache();
    }
    // promotion choice
    log.debug('Move succeeded');
    return true;
  }

  public move([startFile, startRank]: Coordinate,
      [endFile, endRank]: Coordinate, untrack?: boolean): MoveInfo {
    const occupant = this.spaces[startFile][startRank];
    const endOccupant = this.spaces[endFile][endRank];
    let special: SpecialMove | undefined;
    // Check for castling
    if (occupant && endOccupant) {
      const [color, piece] = occupant;
      const [endColor, endPiece] = endOccupant;
      if (color === endColor && piece === 'king' && endPiece === 'rook') {
        const kingFile = Math.sign(endFile - startFile) * 2 + startFile;
        const rookFile = Math.sign(endFile - startFile) + startFile;
        this.spaces[startFile][startRank] = '';
        this.spaces[endFile][endRank] = '';
        this.spaces[kingFile][startRank] = [color, 'king'];
        this.spaces[rookFile][startRank] = [color, 'rook'];
        special = ['castling'];
      }
    }
    // Check for en passant
    if (occupant) {
      const [color, piece] = occupant;
      if (piece === 'pawn' && endRank !== startRank) {
        if (this.mostRecentMove) {
          const [_, [[recentStartFile, recentStartRank],
            [recentEndFile, recentEndRank]]] = this.mostRecentMove;
          const recentOccupant = this.spaces[recentEndFile][recentEndRank];
          if (recentOccupant) {
            const [recentColor, recentPiece] = recentOccupant;
            if (recentPiece === 'pawn' &&
                Math.abs(recentEndRank - recentStartRank) === 2 &&
                coordEq([endFile, endRank],
                  [recentEndFile, (recentEndRank + recentStartRank) / 2])) {
              this.spaces[startFile][startRank] = '';
              this.spaces[endFile][endRank] = occupant;
              this.spaces[recentEndFile][recentEndRank] = '';
              special = ['enpassant'];
            }
          }
        }
      }
    }
    // TODO non-queen promotion
    // Check for promotion
    if (occupant) {
      const [color, piece] = occupant;
      if (piece === 'pawn' && (endRank === 0 || endRank === 7)) {
        this.spaces[startFile][startRank] = '';
        this.spaces[endFile][endRank] = [color, 'queen'];
        special = ['promotion', 'queen'];
      }
    }
    if (!special) {
      this.spaces[startFile][startRank] = '';
      this.spaces[endFile][endRank] = occupant;
    }
    const info: MoveInfo =
      [endOccupant, [[startFile, startRank], [endFile, endRank]], special];
    if (!untrack) {
      this.checkCastle([startFile, startRank]);
      this.checkCastle([endFile, endRank]);
      this.mostRecentMove = info;
    }
    return info;
  }

  public undoMove(currentInfo: MoveInfo) {
    const [endOccupant,
      [[startFile, startRank], [endFile, endRank]],
      specialMove] = currentInfo;
    const occupant = this.spaces[endFile][endRank];
    if (specialMove) {
      const special = specialMove[0];
      switch (special) {
        case 'castling':
          const kingFile = Math.sign(endFile - startFile) * 2 + startFile;
          const rookFile = Math.sign(endFile - startFile) + startFile;
          const kingOccupant = this.spaces[kingFile][startRank];
          if (!kingOccupant) {
            throw new Error('King is not at expected spot after castling!');
          }
          const [kingColor, kingPiece] = kingOccupant;
          this.spaces[startFile][startRank] = [kingColor, 'king'];
          this.spaces[endFile][endRank] = [kingColor, 'rook'];
          this.spaces[kingFile][startRank] = '';
          this.spaces[rookFile][startRank] = '';
          break;
        case 'enpassant':
          // occupant is pawn
          this.spaces[startFile][startRank] = occupant;
          this.spaces[endFile][endRank] = endOccupant;
          const prevInfo = this.mostRecentMove!;
          const [prevFile, prevRank] = prevInfo[1][1];
          if (occupant) {
            const [color, piece] = occupant;
            this.spaces[prevFile][prevRank] = [opponent(color), 'pawn'];
          }
          break;
        case 'promotion':
          const target = specialMove[1];
          if (occupant) {
            const [color, piece] = occupant;
            this.spaces[startFile][startRank] = [color, 'pawn'];
            this.spaces[endFile][endRank] = endOccupant;
          }
          break;
      }
    }
    else {
      this.spaces[startFile][startRank] = occupant;
      this.spaces[endFile][endRank] = endOccupant;
    }
  }

  public getAllValidMoves(player: Color,
      ignoreChecking?: boolean): Array<[Coordinate, Coordinate]> {
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
        const moves = this.getValidMoves(coord, ignoreChecking);
        const coordMoves: Array<[Coordinate, Coordinate]>
          = moves.map((move) => [coord, move] as [Coordinate, Coordinate]);
        allMoves.push(...coordMoves);
      }
    }
    return allMoves;
  }

  public getValidMoves(coord: Coordinate,
      ignoreChecking?: boolean): Coordinate[] {
    const [file, rank] = coord;
    const occupant = this.space(coord);
    if (!occupant) {
      log.debug('No valid moves because the space was not occupied');
      return [];
    }
    // Check in cache to see if it can be found
    const cache = this.getCache();
    if (cache.enabled) {
      const coordString = coordToString(coord);
      const cached = cache.validMoveCache.get(coordString);
      if (cached) {
        log.debug('Found valid moves in cache');
        return cached;
      }
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
          // Check en passant
          else {
            if (this.mostRecentMove) {
              const [_, [[recentStartFile, recentStartRank],
                [recentEndFile, recentEndRank]]] = this.mostRecentMove;
              const recentOccupant = this.spaces[recentEndFile][recentEndRank];
              if (recentOccupant) {
                const [recentColor, recentPiece] = recentOccupant;
                const [endFile, endRank] = diagonal;
                if (recentPiece === 'pawn' &&
                    Math.abs(recentEndRank - recentStartRank) === 2 &&
                    coordEq([endFile, endRank],
                      [recentEndFile, (recentEndRank + recentStartRank) / 2])) {
                  moves.push([diagonal]);
                }
              }
            }
          }
        }
      }
    }
    let indivMoves: Coordinate[] = [];
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
        // Pawn has enemy blocking on non-diagonal
        if (piece === 'pawn') {
          const [moveFile, moveRank] = move;
          if (file === moveFile) {
            break;
          }
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
    // When ignoring checking, don't need to worry about castle, because it can
    // never capture anything
    if (!ignoreChecking) {
      // Check for castling
      if (piece === 'king') {
        // Make sure neither king nor rook have moved
        let untrackIndex: number;
        if (color === 'white') {
          untrackIndex = 0;
        }
        else {
          untrackIndex = 1;
        }
        // Check file a rook
        if (this.canCastle[untrackIndex][0]) {
          let found = false;
          // Check intermediate empty space
          for (let i = 1; i <= 3; i++) {
            const tempOccupant = this.spaces[i][rank];
            if (tempOccupant) {
              found = true;
              break;
            }
          }
          if (!found) {
            // Check not in check
            if (!this.isInCheck(color) &&
                !this.hypotheticalIsInCheck(color, coord, [3, rank]) &&
                !this.hypotheticalIsInCheck(color, coord, [2, rank])) {
              indivMoves.push([0, rank]);
            }
          }
        }
        // Check file h rook
        if (this.canCastle[untrackIndex][1]) {
          let found = false;
          // Check intermediate empty space
          for (let i = 5; i <= 6; i++) {
            const tempOccupant = this.spaces[i][rank];
            if (tempOccupant) {
              found = true;
              break;
            }
          }
          if (!found) {
            // Check not in check
            if (!this.isInCheck(color) &&
                !this.hypotheticalIsInCheck(color, coord, [5, rank]) &&
                !this.hypotheticalIsInCheck(color, coord, [6, rank])) {
              indivMoves.push([7, rank]);
            }
          }
        }
      }
      // When not ignoring checking, make sure move does not lead to check
      indivMoves = indivMoves.filter((move: Coordinate) => {
        return !this.hypotheticalIsInCheck(color, coord, move);
      });
    }
    if (cache.enabled) {
      const coordString = coordToString(coord);
      cache.validMoveCache.set(coordString, indivMoves);
    }
    return indivMoves;
  }

  public isInCheck(defendingPlayer: Color): boolean {
    // Assuming only one king is in play
    const kingLocations = this.findPieces(defendingPlayer, 'king');
    // Check if any of the opponent's moves results in a checkmate
    const opp = opponent(defendingPlayer);
    const oppMoves = this.getAllValidMoves(opp, true);
    for (const move of oppMoves) {
      const dest = move[1];
      for (const kingLocation of kingLocations) {
        if (coordEq(dest, kingLocation)) {
          return true;
        }
      }
    }
    return false;
  }

  public findPieces(color: Color, piece: Piece): Coordinate[] {
    const coords: Coordinate[] = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const occupant = this.spaces[i][j];
        if (!occupant) {
          continue;
        }
        const [occupantColor, occupantPiece] = occupant;
        if (color === occupantColor && piece === occupantPiece) {
          coords.push([i, j]);
        }
      }
    }
    return coords;
  }

  public getCache(): BoardCache {
    if (!boardCache.has(this.boardId)) {
      boardCache.set(this.boardId, new BoardCache());
    }
    return boardCache.get(this.boardId)!;
  }

  private hypotheticalIsInCheck(defendingPlayer: Color, start: Coordinate,
      end: Coordinate) {
    this.getCache().enabled = false;
    const info = this.move(start, end, true);
    const inCheck = this.isInCheck(defendingPlayer);
    this.undoMove(info);
    this.getCache().enabled = true;
    return inCheck;
  }

  private checkCastle([file, rank]: Coordinate) {
    // Check if moving piece is rook or king to prevent future castling
    const occupant = this.spaces[file][rank];
    if (occupant) {
      const [color, piece] = occupant;
      let untrackIndex: number;
      let rookRank: number;
      if (color === 'white') {
        untrackIndex = 0;
        rookRank = 0;
      }
      else {
        untrackIndex = 1;
        rookRank = 7;
      }
      // King moved, can't castle anymore
      if (piece === 'king') {
        this.canCastle[untrackIndex][0] = 0;
        this.canCastle[untrackIndex][1] = 0;
      }
      else if (piece === 'rook') {
        // Find out which rook
        if (coordEq([file, rank], [0, rookRank])) {
          this.canCastle[untrackIndex][0] = 0;
        }
        else if (coordEq([file, rank], [7, rookRank])) {
          this.canCastle[untrackIndex][1] = 0;
        }
      }
    }
  }
}

type MoveInfo = [Space, [Coordinate, Coordinate], SpecialMove?];
