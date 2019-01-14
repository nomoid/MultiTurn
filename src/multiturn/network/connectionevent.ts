import ARSocket from './arsocket';
import { ConnectionEvent, Socket } from './network';

export default class AbstractConnectionEvent implements ConnectionEvent {

  public constructor(private socket: ARSocket) {

  }

  public accept(): Socket {
    this.socket.accept();
    return this.socket;
  }

  public reject(): void {
    this.socket.reject();
  }

}
