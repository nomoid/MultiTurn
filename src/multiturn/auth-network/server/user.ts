import CancelablePromise from '../../helper/cancelablepromise';
import { compareNumber } from '../../helper/uid';
import { Socket, RequestEvent } from '../../network/network';
import { Serializer, Deserializer } from '../../sio-network/serializer';
import { verbose } from './layer';
import OutgoingRequest from './outgoingrequest';
import AuthRequestEvent from './requestevent';

export default class AuthUser {

  private listeners: Array<(e: RequestEvent) => void>;
  private outgoingRequests: Map<string, OutgoingRequest>;
  private requestCounter = 0;

  public constructor(readonly id: string, public socket: Socket,
    private serializer: Serializer, private deserializer: Deserializer) {
    this.listeners = [];
    this.outgoingRequests = new Map();
  }

  public addRequestListener(callback: (e: RequestEvent) => void) {
    this.listeners.push(callback);
  }

  public request(key: string, message: string): CancelablePromise<string> {
    const orderId = this.requestCounter;
    const req = new OutgoingRequest(key, message, orderId, () => {
      this.outgoingRequests.delete(req.uid);
    });
    this.outgoingRequests.set(req.uid, req);
    this.requestCounter += 1;
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

  // Resend all outstanding requests, in order of request creation
  public refresh() {
    const reqs = Array.from(this.outgoingRequests.values());
    reqs.sort((a: OutgoingRequest, b: OutgoingRequest) => {
      return compareNumber(a.orderId, b.orderId);
    });
    for (const req of reqs) {
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
