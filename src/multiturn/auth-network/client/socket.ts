import CancelablePromise from '../../helper/cancelablepromise';
import { Socket, RequestEvent } from '../../network/network';
import { Deserializer, Serializer } from '../../sio-network/serializer';
import AuthClientRequestEvent from './requetevent';

export default class AuthClientSocket implements Socket {

  private accepted: boolean = false;

  public constructor(private socket: Socket, private token: string,
      private serializer: Serializer, private deserializer: Deserializer) {

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
    this.socket.addRequestListener((e: RequestEvent) => {
      const uid = e.key;
      const [success, key, message] = this.deserializer(e.message);
      if (success) {
        callback(new AuthClientRequestEvent(e.respond.bind(e), key, message));
      }
      // Do nothing on failed deserializing
    });
  }

  public request(key: string, message: string): CancelablePromise<string> {
    return this.socket.request(this.token, this.serializer(key, message));
  }

  public close(): void {
    this.socket.close();
  }

}
