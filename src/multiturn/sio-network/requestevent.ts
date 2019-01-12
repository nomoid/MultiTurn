import { RequestEvent } from '../network';

export default class SIORequestEvent implements RequestEvent {

  public constructor(readonly key: string, readonly message: string) {

  }

  public respond(message: string): void {
    throw new Error('Method not implemented.');
  }

}
