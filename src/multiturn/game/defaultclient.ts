import { ClientSyncStateEvent } from '../sync/client';
import { Client } from './client';
import { CombinedInfo } from './info';

type StateListener<S> = (s: S) => void;
type MessageListener = (s: string) => void;

export default abstract class DefaultClient<T, S, R> implements Client<T> {

  protected latestMoveResolver?: (m: R) => void;
  private stateListeners: Array<StateListener<S>> = [];
  private messageListeners: MessageListener[] = [];
  private state!: S;
  private lastestInfo?: CombinedInfo;

  // Client methods
  public updateState(e: ClientSyncStateEvent, info: CombinedInfo) {
    this.lastestInfo = info;
    let message = '';
    if (this.getPlayerNum()) {
      message += `You are playing as ${this.numToString(this.getPlayerNum())}.`;
    }
    if (info.gameOver) {
      message += ` ${this.convertGameOverMessage(info.gameOver)}`;
    }
    else {
      if (info.turn === 0) {
        message += ' Waiting for more players...';
      }
      else if (info.turn === this.getPlayerNum()) {
        message += ' It is currently your turn.';
      }
      else {
        message += ' Waiting for another player\'s move.';
      }
    }
    this.state = JSON.parse(e.state) as S;
    this.bindPrototype(this.state);
    for (const listener of this.stateListeners) {
      listener(this.state);
    }
    for (const listener of this.messageListeners) {
      listener(message);
    }
  }

  public addStateListener(listener: StateListener<S>) {
    this.stateListeners.push(listener);
  }

  public addMessageListener(listener: MessageListener) {
    this.messageListeners.push(listener);
  }

  public resolveMove(move: R) {
    if (this.latestMoveResolver) {
      this.latestMoveResolver(move);
    }
  }

  public getState(): S {
    return this.state;
  }

  public getLatestInfo(): CombinedInfo | undefined {
    return this.lastestInfo;
  }

  public getPlayerNum(): number {
    const info = this.getLatestInfo();
    if (!info) {
      return 0;
    }
    return info.num;
  }

  public isCurrentTurn(): boolean {
    const info = this.getLatestInfo();
    if (!info) {
      return false;
    }
    return info.turn === info.num;
  }

  public abstract getRemote(): T;

  protected abstract bindPrototype(s: S): void;

  protected abstract numToString(num: number): string;

  protected convertGameOverMessage(org: string): string {
    let message = 'Game over. ';
    const winner = parseInt(org, 10);
    if (winner === 0) {
      message += 'Tie game.';
    }
    else if (winner === this.getPlayerNum()) {
      message += 'You win!';
    } else {
      message += 'You lose!';
    }
    return message;
  }
}
