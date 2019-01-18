import { Socket, RequestEvent } from '../../network/network';
import { Deserializer, Serializer } from '../../sio-network/serializer';

export default class AuthClientSocket implements Socket {

  private accepted: boolean = false;

  public constructor(private socket: Socket, private token: string,
      private serializer: Serializer, private deserializer: Deserializer) {

  }

  public accept() {
    this.accepted = true;
  }

  public reject() {
    if (this.accepted) {
      throw Error('Socket already accepted or rejected');
    }
    this.close();
  }

  public addRequestListener(callback: (e: RequestEvent) => void): void {
    this.socket.addRequestListener(callback);
  }

  public request(key: string, message: string): Promise<string> {
    return this.socket.request(this.token, this.serializer(key, message));
  }

  public close(): void {
    this.socket.close();
  }

}
