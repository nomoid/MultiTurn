import * as Cookie from 'js-cookie';
import * as sio from 'socket.io-client';
import AuthClientCookieTokenHandler from '../../multiturn/auth-network/client/cookie';
import AuthClientNetworkLayer from '../../multiturn/auth-network/client/layer';
import RepeatClientSyncLayer from '../../multiturn/repeat-sync/client/layer';
import SIOClientNetworkLayer from '../../multiturn/sio-network/client/layer';
import { ClientSyncResponder, ClientSyncRequestEvent, ClientSyncStateEvent } from '../../multiturn/sync/client';

const io = sio();
const authTokenId = 'auth.token';

class TestResponder implements ClientSyncResponder {

  private localState: number = 0;

  public onUpdateState(e: ClientSyncStateEvent): Promise<void> {
    console.log(`State updated, new state: ${e.state}`);
    this.localState = parseInt(e.state, 10);
    return Promise.resolve();
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
  console.log('Starting client');
  const localToken = Cookie.get(authTokenId);
  if (localToken) {
    console.log(`Local token found ${localToken}`);
  }
  else {
    console.log('No local token found, requesting new token');
  }
  const netLayer = new SIOClientNetworkLayer(io);
  const authLayer = new AuthClientNetworkLayer(netLayer, localToken);
  authLayer.setTokenHandler(new AuthClientCookieTokenHandler());
  const responder = new TestResponder();
  const syncLayer = new RepeatClientSyncLayer(authLayer, responder);
  syncLayer.listen();
}

main();
