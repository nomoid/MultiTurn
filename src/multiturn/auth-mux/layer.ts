import AbstractConnectionEvent from '../network/connectionevent';
import { NetworkLayer, ConnectionEvent, Socket } from '../network/network';
import AuthOverflowMultiplexer from './overflow';

export default class OverflowNetworkLayer implements NetworkLayer{

  private listeners: Array<(e: ConnectionEvent) => void> = [];
  private listening: boolean = false;

  public constructor(overflow: AuthOverflowMultiplexer) {
    // TODO
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
  }

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

  public fireEvent(socket: Socket) {
    if (this.listening) {
      for (const listener of this.listeners) {
        listener(new AbstractConnectionEvent(socket));
      }
    }
  }
}
