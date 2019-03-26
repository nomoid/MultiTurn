import * as logger from 'loglevel';
import CancelablePromise, { cancelablePromise } from '../helper/cancelablepromise';
import { Socket, RequestEvent, SocketCloseEvent } from '../network/network';
import SIORequestEvent from '../network/requestevent';
import { Serializer, Deserializer } from './serializer';
import { SIOSocket } from './sio-external';

const log = logger.getLogger('Net');

const requestId = '_request';
const responseId = '_response';
const connRefusedId = '_refused';
const closeId = '_close';

export default class SIONetworkSocket implements Socket {

  private listeners: Array<(e: RequestEvent) => void> = [];
  private closeListeners: Array<(e: SocketCloseEvent) => void> = [];
  private promises: Map<string, (s: string) => void> = new Map();
  // True if accepted or rejected
  private responded: boolean = false;
  private closed: boolean = false;

  public constructor(private socket: SIOSocket,
    private serialize: Serializer, private deserialize: Deserializer) {

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
          log.debug(`Incoming Request: ${key},${message}`);
          const event = new SIORequestEvent(this, key, message);
          listener(event);
        }
        if (this.listeners.length === 0) {
          log.warn(`No listeners listened for the incoming
            request!`);
        }
      }
      else {
        log.warn('Failed deserializing!');
      }
    });
    this.socket.on(responseId, (value: string) => {
      const [success, key, message] = this.deserialize(value);
      if (success) {
        if (this.promises.has(key)) {
          log.debug(`Incoming Response: ${key},${message}`);
          const resolve = this.promises.get(key) as (s: string) => void;
          resolve(message);
        }
        else {
          log.warn(`Incoming Response Rejected: ${key},${message}`);
        }
      }
      else {
        log.warn('Failed deserializing!');
      }
    });
    this.socket.on(connRefusedId, () => {
      // Connection refused
      log.info('Connection refused!');
      this.closed = true;
      this.socket.disconnect();
    });
    this.socket.on(closeId, (msg) => {
      if (this.closed) {
        return;
      }
      this.closed = true;
      // Connection closed
      log.debug('Connection closed.');
      for (const listener of this.closeListeners) {
        listener({
          reason: msg
        });
      }
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

  public addCloseListener(callback: (e: SocketCloseEvent) => void): void {
    if (this.closed){
      throw Error('Socket already closed');
    }
    this.closeListeners.push(callback);
  }

  public request(key: string, message: string): CancelablePromise<string> {
    this.socketReadyCheck();
    return cancelablePromise((resolve, reject) => {
      log.debug(`Outgoing Request: ${key},${message}`);
      this.promises.set(key, resolve);
      this.socket.emit(requestId, this.serialize(key, message));
    });
  }

  public respond(key: string, message: string) {
    this.socketReadyCheck();
    log.debug(`Outgoing Response: ${key},${message}`);
    this.socket.emit(responseId, this.serialize(key, message));
  }

  // Closing a rejected socket/already closed should not throw an error
  public close(): void {
    if (this.closed) {
      return;
    }
    if (!this.responded) {
      throw Error('Socket not yet accepted');
    }
    this.closed = true;
    this.socket.emit(closeId);
    this.socket.disconnect();
    for (const listener of this.closeListeners) {
      listener({});
    }
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
