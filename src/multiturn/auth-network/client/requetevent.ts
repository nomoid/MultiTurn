import { RequestEvent } from '../../network/network';

export default class AuthClientRequestEvent implements RequestEvent {

  public constructor(private responder: (message: string) => void,
      readonly key: string, readonly message: string) {

  }

  public respond(message: string): void {
    this.responder(message);
  }
}
