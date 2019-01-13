import { NetworkLayer, ConnectionEvent, RequestEvent, Socket } from '../network';
import AuthConnectionEvent from './connectionevent';

const registerId = 'register';

export default class AuthNetworkLayer implements NetworkLayer {

  private users: Map<string, Socket>;
  private listeners: Array<(e: ConnectionEvent) => void>;
  private listening: boolean = false;

  // Use an underlying network layer for actual network connections
  public constructor(private network: NetworkLayer) {
    this.listeners = [];
    this.users = new Map();
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.network.addConnectionListener((e: ConnectionEvent) => {
      const socket = e.socket;
      socket.addRequestListener(this.handleRequest(socket).bind(this));
      e.accept();
    });
    this.network.listen();
  }

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

  private handleRequest(socket: Socket) {
    return (e: RequestEvent) => {
      if (e.key === registerId) {
        // Check if socket is already registered, if so, give them their ID
        for (const id of this.users.keys()) {
          const sock = this.users.get(id);
          if (sock === socket) {
            e.respond(id);
            return;
          }
        }
        // Socket is not registered, register it
        for (const listener of this.listeners) {
          listener(new AuthConnectionEvent());
        }
      }
      // TODO
    }
  }

}
