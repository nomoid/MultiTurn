import * as React from 'react';

export const ChessOptions = () => {
  return (
    <div>
      Options:
      <input type='checkbox' id='chessboard-colors' defaultChecked /><label>Colors</label>
      <input type='checkbox' id='highlight-moves' defaultChecked /><label>Highlight Moves</label>
      <input type='checkbox' id='invert-board' defaultChecked /><label>Invert on Black</label>
    </div>
  );
};
