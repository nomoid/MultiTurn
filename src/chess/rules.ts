export type Piece = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type Color = 'black' | 'white';
export type Space = [Color, Piece] | '';
export type Coordinate = [number, number];
export type SpecialMove = 'castling' | 'enpassant' | 'promotion';

// Returns a 2D array to deal with blocking
// Essentially, if any move in a subarray is unreachable, all further moves in
// that subarray will also be marked as unreachable
export function potentialMoves(
    piece: Piece, coord: Coordinate): Coordinate[][] {
  const [file, rank] = coord;
  let moves: Coordinate[][] = [];
  let subarray: Coordinate[];
  switch (piece) {
    // Pawn has special movement rules, handle it separately
    case 'pawn':
      break;
    case 'rook':
      subarray = [];
      // Add all spaces with the same file
      for (let i = rank - 1; i >= 0; i--) {
        subarray.push([file, i]);
      }
      moves.push(subarray);
      subarray = [];

      for (let i = rank + 1; i < 8; i++) {
        subarray.push([file, i]);
      }
      moves.push(subarray);
      subarray = [];

      // Add all spaces with the same rank
      for (let i = file - 1; i >= 0; i--) {
        subarray.push([i, rank]);
      }
      moves.push(subarray);

      subarray = [];
      for (let i = file + 1; i < 8; i++) {
        subarray.push([i, rank]);
      }
      moves.push(subarray);
      break;
    case 'knight':
      const parity = [-1, 1];
      // All moves that are one off in one coordinate and two off in the other
      for (const oneParity of parity) {
        for (const twoParity of parity) {
          moves.push([[file + oneParity, rank + twoParity * 2]]);
          moves.push([[file + twoParity * 2, rank + oneParity]]);
        }
      }
      break;
    case 'bishop':
      // All places that are diagonal from current position
      subarray = [];
      for (let i = file - 1; i >= 0; i--) {
        subarray.push([i, rank + i - file]);
      }
      moves.push(subarray);

      subarray = [];
      for (let i = file + 1; i < 8; i++) {
        subarray.push([i, rank + i - file]);
      }
      moves.push(subarray);

      subarray = [];
      for (let i = file - 1; i >= 0; i--) {
        subarray.push([i, rank + file - i]);
      }
      moves.push(subarray);

      subarray = [];
      for (let i = file + 1; i < 8; i++) {
        subarray.push([i, rank + file - i]);
      }
      moves.push(subarray);
      break;
    case 'queen':
      // All moves of the rook combined with all moves of the bishop
      moves.push(...potentialMoves('rook', coord));
      moves.push(...potentialMoves('bishop', coord));
      break;
    case 'king':
      // All places that are one square away
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          moves.push([[file + i, rank + j]]);
        }
      }
      break;
  }
  // Eliminate out of bounds moves
  moves = moves.map((subarr) => subarr.filter(isValidSpace));
  // Eliminate non-moves
  moves = moves.map((subarr) => subarr.filter((move) => !coordEq(move, coord)));
  // Eliminate empty subarrays
  moves = moves.filter((subarr) => subarr.length > 0);
  return moves;
}

// Assuem that rank and file are both integers
export function isValidSpace([file, rank]: Coordinate) {
  return rank >= 0 && rank < 8 && file >= 0 && file < 8;
}

export function coordEq([file1, rank1]: Coordinate, [file2, rank2]: Coordinate) {
  return file1 === file2 && rank1 === rank2;
}

export function coordToString([file, rank]: Coordinate) {
  return `${String.fromCharCode(file + 97)}${rank + 1}`;
}

export function numToColor(num: number): Color {
  if (num === 1) {
    return 'white';
  }
  else if (num === 2) {
    return 'black';
  }
  throw new Error(`Invalid player number: ${num}`);
}

export function opponent(color: Color): Color {
  if (color === 'white') {
    return 'black';
  }
  else {
    return 'white';
  }
}

export function frontSpace([file, rank]: Coordinate,
    color: Color, amount: number): Coordinate {
  if (color === 'white') {
    return [file, rank + amount];
  }
  else {
    return [file, rank - amount];
  }
}

export function diagonalSpaces([file, rank]: Coordinate,
    color: Color): Coordinate[] {
  if (color === 'white') {
    return [[file - 1, rank + 1], [file + 1, rank + 1]];
  }
  else {
    return [[file - 1, rank - 1], [file + 1, rank - 1]];
  }
}

export function pieceFromFile(file: number): Piece {
  switch (file) {
    case 0:
    case 7:
      return 'rook';
    case 1:
    case 6:
      return 'knight';
    case 2:
    case 5:
      return 'bishop';
    case 3:
      return 'queen';
    case 4:
      return 'king';
  }
  throw new Error(`Invalid file ${file}!`);
}

export function setupDefault(spaces: Space[][]) {
  for (let i = 0; i < 8; i++) {
    spaces.push([]);
    for (let j = 0; j < 8; j++) {
      let piece: Space = '';
      // Populate white pieces
      if (j === 0) {
        piece = ['white', pieceFromFile(i)];
      }
      // Populate white pawns
      else if (j === 1) {
        piece = ['white', 'pawn'];
      }
      // Populate black pawns
      else if (j === 6) {
        piece = ['black', 'pawn'];
      }
      else if (j === 7) {
        piece = ['black', pieceFromFile(i)];
      }
      spaces[i].push(piece);
    }
  }
}
