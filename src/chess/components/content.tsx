import * as React from 'react';
import { clearLocalToken } from '../../multiturn/auth-network/client/cookie';
import Board from '../board';
import Move from '../move';
import { Color } from '../rules';
import { ChessBoard } from './chessboard';
import { ChessOptions } from './chessoptions';

interface Props {
  started: boolean;

  roomOutput: string;
  headerOutput: string;

  remoteColor: Color;
  boardState: Board;
  isCurrentTurn: boolean;

  resolveMove: (move: Move) => void;
  setNewBoard: (board: Board) => void;
}

export const Content = (props: Props) => {

  const [color, setColor] = React.useState(true);
  const [highlight, setHighlight] = React.useState(true);
  const [invert, setInvert] = React.useState(true);

  const leave = (e: React.MouseEvent) => {
    clearLocalToken();
    location.reload();
  };

  return (
    <div id='main-content'>
      <div id='room-output'>{props.roomOutput}</div>
      <div id='header-output'>{props.headerOutput}</div>
      <br />
      <ChessBoard boardState={props.boardState}
        setNewBoard={props.setNewBoard} resolveMove={props.resolveMove}
        remoteColor={props.remoteColor} isCurrentTurn={props.isCurrentTurn}
        color={color} highlight={highlight} invert={invert} />
      <br />
      <ChessOptions color={color} highlight={highlight} invert={invert}
        updateColor={setColor} updateHighlight={setHighlight}
        updateInvert={setInvert} />
      <br />
      <button id='leave-button' onClick={leave}
        hidden={!props.started}>Leave Game</button>
    </div>
  );
};
