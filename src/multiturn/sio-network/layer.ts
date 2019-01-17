import AbstractConnectionEvent from '../network/connectionevent';
import { NetworkLayer, ConnectionEvent } from '../network/network';
import { Serializer, Deserializer,
  defaultSerializer, defaultDeserializer } from './serializer';
import SIONetworkSocket from './socket';

/**
 * A socket.io based implementation of the Network layer
 */
export default abstract class SIONetworkLayer implements NetworkLayer {

  protected serializer: Serializer;
  protected deserializer: Deserializer;
  protected listeners: Array<(e: ConnectionEvent) => void>;

  public constructor(serializer?: Serializer, deserializer?: Deserializer) {
    this.listeners = [];
    if (serializer) {
      this.serializer = serializer;
    }
    else {
      this.serializer = defaultSerializer('$');
    }
    if (deserializer) {
      this.deserializer = deserializer;
    }
    else {
      this.deserializer = defaultDeserializer('$');
    }
  }

  public abstract listen(): void;

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

}
