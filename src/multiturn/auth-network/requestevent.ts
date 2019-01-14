import { RequestEvent } from '../network';
import AuthUser from './user';

export default class AuthRequestEvent implements RequestEvent {

  public constructor(readonly key: string, readonly message: string,
    private responder: (message: string) => void){

  }

  public respond(message: string): void {
    this.responder(message);
  }

}
