import { ConnectionEvent, Socket } from '../network';
import AuthNetworkLayer from './layer';
import AuthSocket from './socket';

export default class AuthConnectionEvent implements ConnectionEvent {

  public constructor(public socket: AuthSocket) {

  }

  public accept(): void {
    throw new Error("Method not implemented.");
  }

  public reject(): void {
    throw new Error("Method not implemented.");
  }


}
