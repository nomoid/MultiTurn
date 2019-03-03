import * as Cookie from 'js-cookie';
import AuthClientCookieTokenHandler from '../auth-network/client/cookie';
import AuthClientNetworkLayer from '../auth-network/client/layer';
import RepeatClientSyncLayer from '../repeat-sync/client/layer';
import SIOClientNetworkLayer from '../sio-network/client/layer';
import { SIOSocket } from '../sio-network/sio-external';
import { ClientSyncResponder } from '../sync/client';

const authTokenId = 'auth.token';
const verbose = false;

export default function defaultClientSyncLayer(io: SIOSocket,
    responder: ClientSyncResponder) {
  const localToken = Cookie.get(authTokenId);
  if (verbose) {
    if (localToken) {
      console.log(`Local token found ${localToken}`);
    }
    else {
      console.log('No local token found, requesting new token');
    }
  }
  const netLayer = new SIOClientNetworkLayer(io);
  const authLayer = new AuthClientNetworkLayer(netLayer, localToken);
  authLayer.setTokenHandler(new AuthClientCookieTokenHandler());
  const syncLayer = new RepeatClientSyncLayer(authLayer, responder);
  return syncLayer;
}
