import { ConnectionEvent, Socket } from '../network';

export default class AuthConnectionEvent implements ConnectionEvent {

  public socket: Socket;

  public accept(): void {
    throw new Error("Method not implemented.");
  }

  public reject(): void {
    throw new Error("Method not implemented.");
  }


}
