import Player from './player';

export default class PlayerSet<R> {

  public constructor() {
    // TODO
  }

  public current(): Player<R> {
    throw new Error('No current player');
  }
}
