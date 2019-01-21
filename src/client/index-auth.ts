import * as Cookie from 'js-cookie';
import * as sio from 'socket.io-client';
import AuthClientNetworkLayer from '../multiturn/auth-network/client/layer';
import { ConnectionEvent, RequestEvent } from '../multiturn/network/network';
import SIOClientNetworkLayer from '../multiturn/sio-network/client/layer';

const io = sio();
const authTokenId = 'auth.token';

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
  authLayer.addConnectionListener((e: ConnectionEvent) => {
    const socket = e.accept();
    const remoteToken = authLayer.token!;
    Cookie.set(authTokenId, remoteToken);
    socket.addRequestListener((e2: RequestEvent) => {
      console.log(`Request: ${e2.message}`);
    });
    socket.request('testKey', 'testMesssage').then((resp: string) => {
      console.log(`Response to testKey: ${resp}`);
    });
  });
  authLayer.listen();
}

main();
