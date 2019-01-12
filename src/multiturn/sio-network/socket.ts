import { Socket, RequestEvent } from '../network';
import { Serializer, Deserializer } from './layer';
import SIORequestEvent from './requestevent';

const requestId = 'request';
const responseId = 'response';
const connRefusedId = 'refused';
const closeId = 'close';

export default class SIONetworkSocket implements Socket {

  private listeners: Array<(e: RequestEvent) => void>;
  private promises: Map<string, (s: string) => void>;

  public constructor(private socket: SocketIO.Socket,
    private serialize: Serializer, private deserialize: Deserializer) {
    this.listeners = [];
    this.promises = new Map();
  }

  public accept() {
    this.socket.on(requestId, (value: string) => {
      const [success, key, message] = this.deserialize(value);
      if (success) {
        for (const listener of this.listeners) {
          const event = new SIORequestEvent(key, message);
          listener(event);
        }
      }
    });
    this.socket.on(responseId, (value: string) => {
      const [success, key, message] = this.deserialize(value);
      if (success) {
        if (this.promises.has(key)) {
          const resolve = this.promises.get(key) as (s: string) => void;
          resolve(message);
        }
      }
    });
  }

  public reject() {
    this.socket.emit(connRefusedId);
    this.socket.disconnect();
  }

  public addRequestListener(callback: (e: RequestEvent) => void): void {
    this.listeners.push(callback);
  }

  public request(key: string, message: string): Promise<string> {
    this.socket.emit(requestId, this.serialize(key, message));
    return new Promise<string>((resolve, reject) => {
      this.promises.set(key, resolve);
    });
  }

  public close(): void {
    this.socket.emit(closeId);
    this.socket.disconnect();
  }

}
