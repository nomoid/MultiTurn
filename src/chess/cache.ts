import { Coordinate } from './rules';

export default class BoardCache {

  // Maps coordinates to their valid moves
  public validMoveCache: Map<string, Coordinate[]> = new Map();
  public enabled: boolean = true;

  public clearCache() {
    this.validMoveCache.clear();
  }
}
