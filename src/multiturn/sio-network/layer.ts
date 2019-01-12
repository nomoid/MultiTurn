import { NetworkLayer, ConnectionEvent, Socket, RequestEvent } from '../network';
import SIOConnectionEvent from './connectionevent';
import SIONetworkSocket from './socket';

export type Serializer = (key: string, message: string) => string;
export type Deserializer = (value: string) => [boolean, string, string];

export function defaultSerializer(key: string, message: string): string {
  // Replace all $ in key with $$
  const newKey = key.replace('\\$', '\\$\\$');
  // Add single $ as separator, don't modify message
  return newKey + '$' + message;
}

export function defaultDeserializer(value: string): [boolean, string, string] {
  let i;
  for (i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '$') {
      // Separator detected
      if (i === value.length - 1) {
        break;
      }
      else if (value[i + 1] !== '$') {
        break;
      }
      else {
        i++;
      }
    }
  }
  let key;
  let message;
  if (i === value.length) {
    key = value;
    message = '';
  }
  else {
    key = value.substring(0, i);
    message = value.substring(i + 1);
  }
  // Replace double dollar signs with single dollar signs
  const newKey = key.replace('\\$\\$', '\\$');
  return [true, newKey, message];
}

/**
 * A socket.io based implementation of the Network layer
 */
export default class SIONetworkLayer implements NetworkLayer {

  private serializer: Serializer;
  private deserializer: Deserializer;
  private listeners: Array<(e: ConnectionEvent) => void>;
  private listening: boolean = false;

  public constructor(private io: SocketIO.Server, serializer?: Serializer,
    deserializer?: Deserializer) {
    this.listeners = [];
    if (serializer) {
      this.serializer = serializer;
    }
    else {
      this.serializer = defaultSerializer;
    }
    if (deserializer) {
      this.deserializer = deserializer;
    }
    else {
      this.deserializer = defaultDeserializer;
    }
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.io.on('connection', (socket: SocketIO.Socket) => {
      for (const listener of this.listeners) {
        const internalSocket = new SIONetworkSocket(socket,
          this.serializer, this.deserializer);
        const event = new SIOConnectionEvent(internalSocket);
        listener(event);
      }
    });
  }

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

}
