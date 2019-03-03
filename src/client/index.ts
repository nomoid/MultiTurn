import * as sio from 'socket.io-client';
import { defaultClientSyncLayer } from '../multiturn/game/client';
import { ClientSyncResponder, ClientSyncStateEvent, ClientSyncRequestEvent } from '../multiturn/sync/client';

const io = sio();

class TestResponder implements ClientSyncResponder {

  private localState: number = 0;

  public onUpdateState(e: ClientSyncStateEvent): void {
    console.log(`State updated, new state: ${e.state}`);
    this.localState = parseInt(e.state, 10);
  }

  public onRequest(e: ClientSyncRequestEvent): Promise<string> {
    console.log(`Request: ${e.key}, ${e.message}`);
    if (e.key === 'response') {
      if (e.message === 'double') {
        this.localState *= 2;
        return Promise.resolve(this.localState.toString());
      }
      else if (e.message === 'increment') {
        this.localState += 1;
        return Promise.resolve(this.localState.toString());
      }
      throw new Error(`Request ${e.message} not found`);
    }
    throw new Error(`Key ${e.key} not found`);
  }
}

function main() {
  const layer = defaultClientSyncLayer(io, new TestResponder());
  layer.listen();
}

main();
