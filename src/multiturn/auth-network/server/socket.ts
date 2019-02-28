import CancelablePromise from '../../helper/cancelablepromise';
import { Socket, RequestEvent } from '../../network/network';
import AuthUser from './user';

export default class AuthSocket implements Socket {

  private accepted: boolean = false;

  public constructor(readonly user: AuthUser){

  }

  public accept() {
    this.accepted = true;
  }

  public reject() {
    if (this.accepted) {
      throw Error('Socket already accepted or rejected');
    }
    this.close();
  }

  public addRequestListener(callback: (e: RequestEvent) => void): void {
    this.user.addRequestListener(callback);
  }

  public request(key: string, message: string): CancelablePromise<string> {
    return this.user.request(key, message);
  }

  public close(): void {
    this.user.close();
  }

}
