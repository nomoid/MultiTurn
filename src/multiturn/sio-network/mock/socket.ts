import { generateUID } from '../../uid';
import { SIOSocket } from '../sio-external';

const verbose = false;

export default class MockSIOSocket implements SIOSocket {

  // Returns two MockSIOSockets paired with each other
  // Use this instead of a public constructor
  public static pair(): [MockSIOSocket, MockSIOSocket] {
    const sock1 = new MockSIOSocket();
    const sock2 = new MockSIOSocket();
    sock1.other = sock2;
    sock2.other = sock1;
    return [sock1, sock2];
  }

  private other!: MockSIOSocket;
  private handlers: Map<string, Array<(s: string) => void>>;
  private disconnected: boolean = false;
  private id: string;

  private constructor() {
    // No public constructor
    this.handlers = new Map();
    this.id = generateUID();
  }

  public emit(key: string, message?: string): void {
    if (this.disconnected) {
      return;
    }
    let msg = '';
    if (message) {
      msg = `;message=${message}`;
    }
    this.log(`emit key=${key}${msg}`);
    this.other.onEmit(key, message);
  }

  public on(key: string, callback: (s: string) => void): void {
    let handlerArray = this.handlers.get(key);
    if (!handlerArray) {
      handlerArray = [];
      this.handlers.set(key, handlerArray);
    }
    handlerArray.push(callback);
  }

  public disconnect(): void {
    this.disconnected = true;
  }

  private onEmit(key: string, message?: string): void {
    if (this.disconnected) {
      return;
    }
    const handlerArray = this.handlers.get(key);
    if (handlerArray) {
      for (const handler of handlerArray) {
        if (message) {
          handler(message);
        }
        else {
          // TODO better handle lack of message case
          handler('');
        }
      }
    }
  }

  private log(s: string) {
    if (verbose) {
      console.log(`[${this.id}]: ${s}`);
    }
  }
}
