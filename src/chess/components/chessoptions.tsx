import * as React from 'react';

interface Props {
  color: boolean;
  highlight: boolean;
  invert: boolean;
  updateColor(b: boolean): void;
  updateHighlight(b: boolean): void;
  updateInvert(b: boolean): void;
}

export const ChessOptions = (props: Props) => {

  const updateColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.updateColor(e.target.checked);
  };

  const updateHighlight = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.updateHighlight(e.target.checked);
  };

  const updateInvert = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.updateInvert(e.target.checked);
  };

  return (
    <div>
      Options:
      <input type='checkbox' id='chessboard-colors' checked={props.color} onChange={updateColor}
        /><label>Colors</label>
      <input type='checkbox' id='highlight-moves' checked={props.highlight} onChange={updateHighlight}
        /><label>Highlight Moves</label>
      <input type='checkbox' id='invert-board' checked={props.invert} onChange={updateInvert}
        /><label>Invert on Black</label>
    </div>
  );
};
