import ARSocket from './arsocket';
import { ConnectionEvent, Socket } from './network';

export default class AbstractConnectionEvent implements ConnectionEvent {

  public constructor(private socket: Socket) {

  }

  public accept(): Socket {
    const socket = this.socket as ARSocket;
    if (socket.accept) {
      socket.accept();
    }
    return this.socket;
  }

  public reject(): void {
    const socket = this.socket as ARSocket;
    if (socket.reject) {
      socket.reject();
    }
    else {
      socket.close();
    }
  }

}
