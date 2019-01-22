import { remote } from '../validator';
import Move from './move';

export default class Player {

  @remote()
  public getMove(): Move {
    return new Move(1, 1);
  }
}
