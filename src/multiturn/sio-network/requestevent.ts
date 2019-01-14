import { RequestEvent } from '../network';
import SIONetworkSocket from './socket';

export default class SIORequestEvent implements RequestEvent {

  public constructor(readonly socket: SIONetworkSocket, readonly key: string,
      readonly message: string) {

  }

  public respond(message: string): void {
    this.socket.respond(this.key, message);
  }

}
