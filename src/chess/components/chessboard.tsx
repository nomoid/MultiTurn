import * as React from 'react';
import Board from '../board';
import Move from '../move';
import { Coordinate, Color } from '../rules';

interface Props {
  remoteColor: Color;
  boardState: Board;
  isCurrentTurn: boolean;

  color: boolean;
  highlight: boolean;
  invert: boolean;

  resolveMove: (move: Move) => void;
  setNewBoard: (board: Board) => void;
}

export const ChessBoard = (props: Props) => {

  const [selected, setSelected] = React.useState<Coordinate | undefined>(undefined);
  const buttonArray: string[][] = [];
  for (let i = 0; i < 8; i++) {
    buttonArray.push([]);
    for (let j = 0; j < 8; j++) {
      buttonArray[i].push(backgroundColorForSpace(i, j, props.color));
    }
  }

  const adj = (num: number) => {
    if (props.invert && props.remoteColor === 'black') {
      return 7 - num;
    }
    else {
      return num;
    }
  };

  if (selected) {
    const [file, rank] = selected;
    buttonArray[adj(file)][adj(rank)] = selectColorForSpace(file, rank, props.color);
    if (props.highlight) {
      // Look for potential moves
      const moves = props.boardState.getValidMoves(selected);
      for (const move of moves) {
        const [moveFile, moveRank] = move;
        buttonArray[adj(moveFile)][adj(moveRank)] =
          highlightColorForSpace(moveFile, moveRank, props.color);
      }
    }
  }

  const buttonClick = (constFile: number, constRank: number) => {
    return (e: React.MouseEvent) => {
      const file = adj(constFile);
      const rank = adj(constRank);
      if (props.isCurrentTurn) {
        return;
      }
      const coord: Coordinate = [file, rank];
      if (selected && props.boardState.isValidMove(selected, coord)) {
        const [startFile, startRank] = selected;
        const boardCopy = props.boardState.clone();
        // Simulate move locally
        boardCopy.tryMove(props.remoteColor,
          [startFile, startRank], [file, rank]);
        props.setNewBoard(boardCopy);
        // Sends move to remote
        props.resolveMove(new Move(startFile, startRank, file, rank));
        setSelected(undefined);
      }
      else if (props.boardState.hasOwnPiece(props.remoteColor, coord)) {
        setSelected(coord);
      }
    };
  };

  const outerElems = [];
  for (let i = 0; i < 8; i++) {
    const elems = [];
    for (let j = 0; j < 8; j++) {
      const name = toName(i, j);
      const file = name.charCodeAt(0) - 97;
      const rank = name.charCodeAt(1) - 49;
      const elem = <button name={name}
        className='chess-button' style={
          {background: buttonArray[file][rank]}
        } onClick={buttonClick(file, rank)}>&nbsp;</button>;
      elems.push(elem);
    }
    outerElems.push(<div className='chess'>{elems}</div>);
  }
  return (
    <div>
      {outerElems};
    </div>
  );
};

function toName(i: number, j: number) {
  return `${String.fromCharCode(j + 97)}${String.fromCharCode(56 - i)}`;
}

function selectColorForSpace(i: number, j: number, fancyColors: boolean) {
  return 'gray';
}

function highlightColorForSpace(i: number, j: number, fancyColors: boolean) {
  if (!fancyColors) {
    return 'skyblue';
  }
  return colorForSpace('#87cefa', '#659abb', i, j);
}

function backgroundColorForSpace(i: number, j: number, fancyColors: boolean) {
  if (!fancyColors) {
    return 'white';
  }
  return colorForSpace('#ffce9e', '#d18b47', i, j);
}

function colorForSpace(light: string, dark: string, i: number, j: number) {
  if ((i + j) % 2 === 0) {
    return dark;
  }
  else {
    return light;
  }
}
