import * as React from 'react';
import Board from '../board';

interface Props {
  boardState: Board;
}

function toName(i: number, j: number) {
  return `${String.fromCharCode(j + 97)}${String.fromCharCode(56 - i)}`;
}

export const ChessBoard = (props: Props) => {
  const outerElems = [];
  for (let i = 0; i < 8; i++) {
    const elems = [];
    for (let j = 0; j < 8; j++) {
      elems.push(<button name={toName(i, j)}
        className='chess-button'>&nbsp;</button>);
    }
    outerElems.push(<div className='chess'>{elems}</div>);
  }
  return (
    <div>
      {outerElems};
    </div>
  );
};
