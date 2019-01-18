import { SIOServer, SIOSocket } from '../sio-external';
import MockSIOSocket from './socket';

export default class MockSIOServer implements SIOServer {

  private listeners: Array<(s: SIOSocket) => void>;
  private serverSockets: MockSIOSocket[];

  public constructor() {
    this.listeners = [];
    this.serverSockets = [];
  }

  public on(key: 'connection', callback: (s: SIOSocket) => void): void {
    this.listeners.push(callback);
  }

  // Returns a client socket
  public connect(): SIOSocket {
    // Make a pair of client/server sockets
    const [clientSocket, serverSocket] = MockSIOSocket.pair();
    this.serverSockets.push(serverSocket);
    return clientSocket;
  }

  public listen(): void {
    for (const serverSocket of this.serverSockets) {
      for (const listener of this.listeners) {
        listener(serverSocket);
      }
    }
  }

}
