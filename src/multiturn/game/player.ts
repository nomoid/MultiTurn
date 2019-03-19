import { PlayerInfo } from './info';

export default class Player<R> {

  // Player num starts at 1 and increases by 1 per player
  public constructor(readonly remote: R, readonly num: number) {

  }

  public getInfo(): PlayerInfo {
    const info = {
      num: this.num
    };
    return info;
  }
}
