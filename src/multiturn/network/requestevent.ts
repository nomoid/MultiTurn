import { RequestEvent } from './network';
import RSSocket from './rssocket';

export default class AbstractRequestEvent implements RequestEvent {

  public constructor(readonly socket: RSSocket, readonly key: string,
      readonly message: string) {

  }

  public respond(message: string): void {
    this.socket.respond(this.key, message);
  }

}
