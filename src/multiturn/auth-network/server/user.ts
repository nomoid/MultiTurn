import CancelablePromise from '../../helper/cancelablepromise';
import { compareNumber } from '../../helper/uid';
import { Socket, RequestEvent } from '../../network/network';
import { RefreshEvent } from '../../network/refresh';
import AbstractRefreshEvent from '../../network/refreshevent';
import { Serializer, Deserializer } from '../../sio-network/serializer';
import { verbose } from './layer';
import OutgoingRequest from './outgoingrequest';
import AuthRequestEvent from './requestevent';

export default class AuthUser {

  private listeners: Array<(e: RequestEvent) => void> = [];
  private refreshListeners: Array<(e: RefreshEvent) => void> = [];

  private outgoingRequests: Map<string, OutgoingRequest> = new Map();
  private requestCounter = 0;

  public constructor(readonly id: string, public socket: Socket,
    private serializer: Serializer, private deserializer: Deserializer) {
  }

  public addRequestListener(callback: (e: RequestEvent) => void) {
    this.listeners.push(callback);
  }

  public addRefreshListener(callback: (e: RefreshEvent) => void): void {
    this.refreshListeners.push(callback);
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
    const msg = this.serializer(request.key, request.message);
    this.socket.request(request.uid, msg)
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
    for (const listener of this.refreshListeners) {
      listener(new AbstractRefreshEvent(this.request.bind(this)));
    }
    const reqs = Array.from(this.outgoingRequests.values());
    reqs.sort((a: OutgoingRequest, b: OutgoingRequest) => {
      return compareNumber(a.orderId, b.orderId);
    });
    for (const req of reqs) {
      if (verbose) {
        console.log(`[Auth] Firing refresh request ${req.uid}: ${req.key},${req.message}`);
      }
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
