import * as React from 'react';
import Board from '../board';
import { Closed } from './closed';
import { Content } from './content';
import { Loading } from './loading';

interface Props {
  roomOutput: string;
  headerOutput: string;
  boardState: Board;
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
