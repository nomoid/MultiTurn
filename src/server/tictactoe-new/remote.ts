import { Client } from '../../multiturn/game/client';
import { remote } from '../../multiturn/remote/remote';
import { ClientSyncStateEvent } from '../../multiturn/sync/client';
import Board from './board';
import Move from './move';

export default class Remote implements Client<Remote> {
  private playerNum!: number;
  private state!: Board;

  @remote(Move)
  public getMove(): Promise<Move> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const move = this.getRandomMove();
        resolve(move);
      }, 1000);
    });
  }

  // Client methods
  public assignNumber(num: number) {
    this.playerNum = num;
  }

  public updateState(e: ClientSyncStateEvent) {
    this.state = JSON.parse(e.state) as Board;
  }

  public getRemote(): Remote {
    return this;
  }

  public gameOver(message: string) {
    console.log(`Game over! ${message}`);
  }

  private getRandomMove(): Move {
    const randomX = Math.floor(Math.random() * 3);
    const randomY = Math.floor(Math.random() * 3);
    return new Move(randomX, randomY);
  }
}
