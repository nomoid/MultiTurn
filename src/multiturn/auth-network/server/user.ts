import { Socket, RequestEvent } from '../../network/network';
import { Serializer, Deserializer } from '../../sio-network/serializer';
import { verbose } from './layer';
import OutgoingRequest from './outgoingrequest';
import AuthRequestEvent from './requestevent';

export default class AuthUser {

  private listeners: Array<(e: RequestEvent) => void>;
  private outgoingRequests: Map<string, OutgoingRequest>;

  public constructor(readonly id: string, public socket: Socket,
    private serializer: Serializer, private deserializer: Deserializer) {
    this.listeners = [];
    this.outgoingRequests = new Map();
  }

  public addRequestListener(callback: (e: RequestEvent) => void) {
    this.listeners.push(callback);
  }

  public request(key: string, message: string): Promise<string> {
    const req = new OutgoingRequest(key, message, () => {
      this.outgoingRequests.delete(req.uid);
    });
    this.outgoingRequests.set(req.uid, req);
    if (verbose) {
      console.log(`[Auth] Firing request ${req.uid}: ${key},${message}`);
    }
    this.fireRequest(req);
    return req.promiseHolder.promise;
  }

  public fireRequest(request: OutgoingRequest) {
    this.socket.request(request.key, request.message)
    .then((response: string) => {
      if (verbose) {
        console.log(`[Auth] Response for request ${request.uid}: ${response}`);
      }
      const req = this.outgoingRequests.get(request.uid);
      if (req) {
        this.outgoingRequests.delete(request.uid);
        req.promiseHolder.resolve(response);
      }
      // Ignore when promise already previously resolved or when cancelled
      return response;
    });
  }

  // Resend all outstanding requests
  public refresh() {
    for (const uid of this.outgoingRequests.keys()) {
      const req = this.outgoingRequests.get(uid)!;
      this.fireRequest(req);
    }
  }

  public handleRequest(e: RequestEvent) {
    const value = e.message;
    const listeners = this.listeners;
    const [success, key, message] = this.deserializer(value);
    if (success) {
      for (const listener of listeners) {
        listener(new AuthRequestEvent(key, message, e.respond.bind(e)));
      }
    }
    // Do nothing on failed deserializing
  }

  public close() {
    this.socket.close();
  }
}
