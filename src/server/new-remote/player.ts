import Move from '../move';
import { remote } from './wrapper';

export default class Player {

  @remote()
  public getMove(): Move {
    return new Move(1, 1);
  }
}
