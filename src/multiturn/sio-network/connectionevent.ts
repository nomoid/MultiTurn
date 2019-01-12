import { ConnectionEvent } from '../network';
import SIONetworkSocket from './socket';

export default class SIOConnectionEvent implements ConnectionEvent {

  public constructor(readonly socket: SIONetworkSocket) {

  }

  public accept(): void {
    this.socket.accept();
  }

  public reject(): void {
    this.socket.reject();
  }

}
