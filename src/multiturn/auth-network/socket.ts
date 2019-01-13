import { Socket, RequestEvent } from '../network';
import AuthUser from './user';

export default class AuthSocket implements Socket {

  public constructor(public user: AuthUser){

  }

  public addRequestListener(callback: (e: RequestEvent) => void): void {
    this.user.addRequestListener(callback);
  }

  public request(key: string, message: string): Promise<string> {
    return this.user.request(key, message);
  }

  public close(): void {
    this.user.close();
  }

}
