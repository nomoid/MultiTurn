import { Client } from '../multiturn/game/client';
import { CombinedInfo } from '../multiturn/game/info';
import { remote } from '../multiturn/remote/remote';
import { ClientSyncStateEvent } from '../multiturn/sync/client';
import Board from './board';
import Move from './move';

type StateListener = (s: Board) => void;
type MessageListener = (s: string) => void;

export function convertToSymbol(i: number): string {
  if (i === 0) {
    return '&nbsp;';
  }
  else if (i === 1) {
    return 'X';
  }
  else if (i === 2) {
    return 'O';
  }
  else {
    return 'I';
  }
}

export default class Remote implements Client<Remote> {
  private playerNum!: number;
  private state!: Board;
  private latestMoveResolver?: (m: Move) => void;
  private stateListeners: StateListener[] = [];
  private messageListeners: MessageListener[] = [];

  @remote(Move)
  public getMove(): Promise<Move> {
    return new Promise((resolve, reject) => {
      // Wait for a button to be pressed
      this.latestMoveResolver = resolve;
    });
  }

  // Client methods
  public updateState(e: ClientSyncStateEvent, info: CombinedInfo) {
    this.playerNum = info.num;
    let message = '';
    if (this.playerNum) {
      message += `You are playing as ${convertToSymbol(this.playerNum)}.`;
    }
    if (info.gameOver) {
      message += ` ${this.convertGameOverMessage(info.gameOver)}`;
    }
    else {
      if (info.turn === 0) {
        message += ' Waiting for more players...';
      }
      else if (info.turn === this.playerNum) {
        message += ' It is currently your turn.';
      }
      else {
        message += ' Waiting for another player\'s move.';
      }
    }
    this.state = JSON.parse(e.state) as Board;
    for (const listener of this.stateListeners) {
      listener(this.state);
    }
    for (const listener of this.messageListeners) {
      listener(message);
    }
  }

  public getRemote(): Remote {
    return this;
  }

  public addStateListener(listener: StateListener) {
    this.stateListeners.push(listener);
  }

  public addMessageListener(listener: MessageListener) {
    this.messageListeners.push(listener);
  }

  public resolveMove(x: number, y: number) {
    const move = new Move(x, y);
    if (this.latestMoveResolver) {
      this.latestMoveResolver(move);
    }
  }

  private convertGameOverMessage(org: string): string {
    let message = 'Game over. ';
    const winner = parseInt(org, 10);
    if (winner === 0) {
      message += 'Tie game.';
    }
    else if (winner === this.playerNum) {
      message += 'You win!';
    } else {
      message += 'You lose!';
    }
    return message;
  }
}
