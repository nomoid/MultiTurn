import CancelablePromise, { cancelablePromise } from '../helper/cancelablepromise';
import { Socket, RequestEvent } from '../network/network';
import SIORequestEvent from '../network/requestevent';
import { Serializer, Deserializer } from './serializer';
import { SIOSocket } from './sio-external';

const requestId = '_request';
const responseId = '_response';
const connRefusedId = '_refused';
const closeId = '_close';

const verbose = true;

export default class SIONetworkSocket implements Socket {

  private listeners: Array<(e: RequestEvent) => void>;
  private promises: Map<string, (s: string) => void>;
  // True if accepted or rejected
  private responded: boolean = false;
  private closed: boolean = false;

  public constructor(private socket: SIOSocket,
    private serialize: Serializer, private deserialize: Deserializer) {
    this.listeners = [];
    this.promises = new Map();
  }

  public accept() {
    if (this.responded) {
      throw Error('Socket already accepted or rejected');
    }
    this.responded = true;
    this.socket.on(requestId, (value: string) => {
      const [success, key, message] = this.deserialize(value);
      if (success) {
        for (const listener of this.listeners) {
          if (verbose) {
            console.log(`[Net] Incoming Request: ${key},${message}`);
          }
          const event = new SIORequestEvent(this, key, message);
          listener(event);
        }
        if (this.listeners.length === 0) {
          if (verbose) {
            console.log(`[Net] Warning: No listeners listened for the incoming
              request!`);
          }
        }
      }
      // Do nothing on failed deserializing
      else {
        if (verbose) {
          console.log('[Net] Failed deserializing');
        }
      }
    });
    this.socket.on(responseId, (value: string) => {
      const [success, key, message] = this.deserialize(value);
      if (success) {
        if (this.promises.has(key)) {
          if (verbose) {
            console.log(`[Net] Incoming Response: ${key},${message}`);
          }
          const resolve = this.promises.get(key) as (s: string) => void;
          resolve(message);
        }
      }
      // Do nothing on failed deserializing
      else {
        if (verbose) {
          console.log('[Net] Failed deserializing');
        }
      }
    });
    this.socket.on(connRefusedId, () => {
      // Connection refused
      this.closed = true;
      this.socket.disconnect();
    });
    this.socket.on(closeId, () => {
      // Connection closed
      this.closed = true;
      this.socket.disconnect();
    });
  }

  public reject() {
    if (this.responded) {
      throw Error('Socket already accepted or rejected');
    }
    this.responded = true;
    this.closed = true;
    this.socket.emit(connRefusedId);
    this.socket.disconnect();
  }

  public addRequestListener(callback: (e: RequestEvent) => void): void {
    if (this.closed){
      throw Error('Socket already closed');
    }
    this.listeners.push(callback);
  }

  public request(key: string, message: string): CancelablePromise<string> {
    this.socketReadyCheck();
    return cancelablePromise((resolve, reject) => {
      if (verbose) {
        console.log(`[Net] Outgoing Request: ${key},${message}`);
      }
      this.promises.set(key, resolve);
      this.socket.emit(requestId, this.serialize(key, message));
    });
  }

  public respond(key: string, message: string) {
    this.socketReadyCheck();
    if (verbose) {
      console.log(`[Net] Outgoing Response: ${key},${message}`);
    }
    this.socket.emit(responseId, this.serialize(key, message));
  }

  // Closing a rejected socket/already closed socket throws an error
  public close(): void {
    this.socketReadyCheck();
    this.closed = true;
    this.socket.emit(closeId);
    this.socket.disconnect();
  }

  private socketReadyCheck() {
    if (this.closed){
      throw Error('Socket already closed');
    }
    if (!this.responded) {
      throw Error('Socket not yet accepted');
    }
  }

}
