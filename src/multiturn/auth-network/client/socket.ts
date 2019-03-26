import * as logger from 'loglevel';
import CancelablePromise from '../../helper/cancelablepromise';
import { Socket, RequestEvent, SocketCloseEvent } from '../../network/network';
import { Deserializer, Serializer } from '../../sio-network/serializer';
import AuthClientRequestEvent from './requetevent';

const log = logger.getLogger('Auth');

export default class AuthClientSocket implements Socket {

  private accepted: boolean = false;
  private seen: Set<string> = new Set();

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
      // If same uid already exists don't repeat event
      if (this.seen.has(uid)) {
        return;
      }
      this.seen.add(uid);
      const [success, key, message] = this.deserializer(e.message);
      if (success) {
        callback(new AuthClientRequestEvent(e.respond.bind(e), key, message));
      }
      else {
        log.warn('Failed deserializing!');
      }
    });
  }

  public addCloseListener(callback: (e: SocketCloseEvent) => void): void {
    this.socket.addCloseListener(callback);
  }

  public request(key: string, message: string): CancelablePromise<string> {
    return this.socket.request(this.token, this.serializer(key, message));
  }

  public close(): void {
    this.socket.close();
  }

}
