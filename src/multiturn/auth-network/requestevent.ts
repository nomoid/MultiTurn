import { RequestEvent } from '../network';
import AuthUser from './user';

export default class AuthRequestEvent implements RequestEvent {

  public constructor(public user: AuthUser, public key: string,
      public message: string){

  }

  public respond(message: string): void {
    this.user.respond(this.key, message);
  }

}
