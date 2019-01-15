import { Socket, RequestEvent } from '../network/network';
import SIORequestEvent from '../network/requestevent';
import { Serializer, Deserializer } from './serializer';

const requestId = 'request';
const responseId = 'response';
const connRefusedId = 'refused';
const closeId = 'close';

export default class SIONetworkSocket implements Socket {

  private listeners: Array<(e: RequestEvent) => void>;
  private promises: Map<string, (s: string) => void>;
  // True if accepted or rejected
  private responded: boolean = false;
  private closed: boolean = false;

  public constructor(private socket: SocketIO.Socket,
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
          const event = new SIORequestEvent(this, key, message);
          listener(event);
        }
      }
      // Do nothing on failed deserializing
    });
    this.socket.on(responseId, (value: string) => {
      const [success, key, message] = this.deserialize(value);
      if (success) {
        if (this.promises.has(key)) {
          const resolve = this.promises.get(key) as (s: string) => void;
          resolve(message);
        }
      }
      // Do nothing on failed deserializing
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

  public request(key: string, message: string): Promise<string> {
    this.socketReadyCheck();
    return new Promise<string>((resolve, reject) => {
      this.socket.emit(requestId, this.serialize(key, message));
      this.promises.set(key, resolve);
    });
  }

  public respond(key: string, message: string) {
    this.socketReadyCheck();
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
