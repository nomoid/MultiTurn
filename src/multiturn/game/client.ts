import * as Cookie from 'js-cookie';
import AuthClientCookieTokenHandler from '../auth-network/client/cookie';
import AuthClientNetworkLayer from '../auth-network/client/layer';
import { RemoteResponder } from '../remote/responder';
import RepeatClientSyncLayer from '../repeat-sync/client/layer';
import SIOClientNetworkLayer from '../sio-network/client/layer';
import { SIOSocket } from '../sio-network/sio-external';
import { ClientSyncResponder, ClientSyncStateEvent, ClientSyncRequestEvent } from '../sync/client';

const assignNumId = '_assignNum';
const remoteCallId = '_remoteCall';
const gameOverId = '_gameOver';
const successId = 'success';
const failureId = 'failure';
const authTokenId = 'auth.token';
const verbose = false;

export function defaultClientSyncLayer(io: SIOSocket,
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

export class ClientGameResponder<T> implements ClientSyncResponder {

  private remote: T;
  private responder: RemoteResponder;

  public constructor(private client: Client<T>) {
    this.remote = client.getRemote();
    this.responder = new RemoteResponder();
    this.responder.addResponder(this.remote);
  }

  public onUpdateState(e: ClientSyncStateEvent): void {
    this.client.updateState(e);
  }

  public onRequest(e: ClientSyncRequestEvent): Promise<string> {
    if (e.key === assignNumId) {
      this.client.assignNumber(parseInt(e.message, 10));
      return Promise.resolve(successId);
    }
    else if (e.key === gameOverId) {
      this.client.gameOver(e.message);
      return Promise.resolve(successId);
    }
    else if (e.key === remoteCallId) {
      return this.responder.onValidationRequest(e.message);
    }
    else {
      // Throw some sort of exception for failed server message
      return Promise.resolve(failureId);
    }
  }
}

export interface Client<T> {

  assignNumber(num: number): void;

  gameOver(message: string): void;

  updateState(e: ClientSyncStateEvent): void;

  getRemote(): T;
}
