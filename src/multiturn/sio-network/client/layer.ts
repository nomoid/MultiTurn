import AbstractConnectionEvent from '../../network/connectionevent';
import SIONetworkLayer from '../layer';
import { Serializer, Deserializer } from '../serializer';
import SIONetworkSocket from '../socket';

export default class SIOClientNetworkLayer extends SIONetworkLayer {

  private listening: boolean = false;

  public constructor(private socket: SIOSocket, serializer?: Serializer,
      deserializer?: Deserializer) {
    super(serializer, deserializer);
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    for (const listener of this.listeners) {
      const internalSocket = new SIONetworkSocket(this.socket,
        this.serializer, this.deserializer);
      const event = new AbstractConnectionEvent(internalSocket);
      listener(event);
    }
  }

}
