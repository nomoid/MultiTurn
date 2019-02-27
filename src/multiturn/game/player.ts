export default class Player<R> {
  public num: number = 0;
  public remote: R;

  public constructor(remote: R) {
    this.remote = remote;
  }

  public win() {
    // TODO
  }
}
