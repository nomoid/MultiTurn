import * as React from 'react';
import Board from '../board';
import { ChessBoard } from './chessboard';
import { ChessOptions } from './chessoptions';

interface Props {
  roomOutput: string;
  headerOutput: string;
  boardState: Board;
}

export const Content = (props: Props) => {
  return (
    <div id='main-content' hidden>
      <div id='room-output'>{props.roomOutput}</div>
      <div id='header-output'>{props.headerOutput}</div>
      <br />
      <ChessBoard boardState={props.boardState} />
      <br />
      <ChessOptions />
      <br />
      <button id='leave-button' hidden>Leave Game</button>
    </div>
  );
};
