import * as React from 'react';
import Board from '../board';
import Move from '../move';
import { Color } from '../rules';
import { Closed } from './closed';
import { Content } from './content';
import { Loading } from './loading';

export type Scene = 'loading' | 'closed' | 'content';

interface Props {
  scene: Scene;
  started: boolean;

  roomOutput: string;
  headerOutput: string;

  remoteColor: Color;
  boardState: Board;
  isCurrentTurn: boolean;

  resolveMove: (move: Move) => void;
  setNewBoard: (board: Board) => void;
}

export const Root = (props: Props) => {
  if (props.scene === 'loading') {
    return <Loading />;
  }
  else if (props.scene === 'closed') {
    return <Closed />;
  }
  else if (props.scene === 'content') {
    return <Content {...props} />;
  }
  else {
    throw new Error(`Invalid scene type ${props.scene}`);
  }
};
