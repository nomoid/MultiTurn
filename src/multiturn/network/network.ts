import CancelablePromise from '../helper/cancelablepromise';
import { NetworkLayer } from './network';
/**
 * The network layer handles transferring information from the client to the
 * server, and vice versa. It uses sockets and connections to abstract away
 * the intricacies of handling networking code.
 * The authentication layer uses a network layer to authenticate the user. It
 * makes sure that users are who they claim to be. Because it exports the same
 * abstraction as the network layer, the implementation of the authentication
 * layer is an instance of the network layer.
 */
export interface NetworkLayer {
  listen(): void;
  addConnectionListener(callback: (e: ConnectionEvent) => void): void;
}

export interface ConnectionEvent {
  accept(): Socket;
  reject(): void;
}

export interface Socket {
  addRequestListener(callback: (e: RequestEvent) => void): void;
  request(key: string, message: string): CancelablePromise<string>;
  close(): void;
}

export interface RequestEvent {
  readonly key: string;
  readonly message: string;
  respond(message: string): void;
}
