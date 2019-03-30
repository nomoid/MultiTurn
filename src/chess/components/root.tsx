import * as React from 'react';
import Board from '../board';
import Move from '../move';
import { Color } from '../rules';
import { Closed } from './closed';
import { Content } from './content';
import { Loading } from './loading';

interface Props {
  roomOutput: string;
  headerOutput: string;

  remoteColor: Color;
  boardState: Board;
  isCurrentTurn: boolean;

  resolveMove: (move: Move) => void;
  setNewBoard: (board: Board) => void;
}

export const Root = (props: Props) => {
  return (
    <div>
      <Loading />
      <Closed />
      <Content {...props}/>
    </div>
  );
};
