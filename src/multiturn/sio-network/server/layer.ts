import AbstractConnectionEvent from '../../network/connectionevent';
import SIONetworkLayer from '../layer';
import { Serializer, Deserializer } from '../serializer';
import { SIOSocket, SIOServer } from '../sio-external';
import SIONetworkSocket from '../socket';

export default class SIOServerNetworkLayer extends SIONetworkLayer {

  private listening: boolean = false;

  public constructor(private io: SIOServer, serializer?: Serializer,
      deserializer?: Deserializer) {
    super(serializer, deserializer);
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.io.on('connection', (socket: SIOSocket) => {
      for (const listener of this.listeners) {
        const internalSocket = new SIONetworkSocket(socket,
          this.serializer, this.deserializer);
        const event = new AbstractConnectionEvent(internalSocket);
        listener(event);
      }
    });
  }

}
