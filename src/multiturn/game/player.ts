export default class Player<R> {

  // TODO add validator to remote
  // public remote: (validator: (v: any) => boolean) => R;

  // Player num starts at 1 and increases by 1 per player
  public constructor(readonly remote: R, readonly num: number) {

  }
}
