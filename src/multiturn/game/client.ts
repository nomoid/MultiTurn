import * as Cookie from 'js-cookie';
import AuthClientCookieTokenHandler, { defaultGetLocalToken } from '../auth-network/client/cookie';
import AuthClientNetworkLayer from '../auth-network/client/layer';
import { NetworkLayer } from '../network/network';
import { RemoteResponder } from '../remote/responder';
import RepeatClientSyncLayer from '../repeat-sync/client/layer';
import SIOClientNetworkLayer from '../sio-network/client/layer';
import { Serializer, Deserializer, defaultSerializer, defaultDeserializer } from '../sio-network/serializer';
import { SIOSocket } from '../sio-network/sio-external';
import { ClientSyncResponder, ClientSyncStateEvent, ClientSyncRequestEvent,
  ClientSyncCloseEvent } from '../sync/client';
import { PlayerInfo, CombinedInfo } from './info';

const assignNumId = '_assignNum';
const remoteCallId = '_remoteCall';
const gameOverId = '_gameOver';
const successId = 'success';
const failureId = 'failure';
const authTokenId = 'auth.token';
const verbose = false;

const defaultRefreshRepeatDelay = 0;
const defaultMaxPing = 10000;
const defaultMaxFailures = 1;

export function defaultClientSyncLayer(io: SIOSocket,
    responder: ClientSyncResponder, refreshRepeatDelay?: number) {
  if (!refreshRepeatDelay) {
    refreshRepeatDelay = defaultRefreshRepeatDelay;
  }
  const localToken = defaultGetLocalToken();
  const netLayer = new SIOClientNetworkLayer(io);
  const authLayer = new AuthClientNetworkLayer(netLayer, localToken,
    refreshRepeatDelay, defaultMaxPing, defaultMaxFailures);
  authLayer.setTokenHandler(new AuthClientCookieTokenHandler());
  const syncLayer = new RepeatClientSyncLayer(authLayer, responder);
  return syncLayer;
}

export function defaultClientSyncLayerFromNetLayer(netLayer: NetworkLayer,
  responder: ClientSyncResponder, refreshRepeatDelay?: number) {
  if (!refreshRepeatDelay) {
    refreshRepeatDelay = defaultRefreshRepeatDelay;
  }
  const localToken = defaultGetLocalToken();
  const authLayer = new AuthClientNetworkLayer(netLayer, localToken,
    refreshRepeatDelay, defaultMaxPing, defaultMaxFailures);
  authLayer.setTokenHandler(new AuthClientCookieTokenHandler());
  const syncLayer = new RepeatClientSyncLayer(authLayer, responder);
  return syncLayer;
}

export class ClientGameResponder<T> implements ClientSyncResponder {

  private remote: T;
  private responder: RemoteResponder;
  private serializer: Serializer;
  private deserializer: Deserializer;

  public constructor(private client: Client<T>,
      serializer?: Serializer, deserializer?: Deserializer) {
    if (serializer) {
      this.serializer = serializer;
    }
    else {
      this.serializer = defaultSerializer('~');
    }
    if (deserializer) {
      this.deserializer = deserializer;
    }
    else {
      this.deserializer = defaultDeserializer('~');
    }
    this.remote = client.getRemote();
    this.responder = new RemoteResponder();
    this.responder.addResponder(this.remote);
  }

  public onUpdateState(e: ClientSyncStateEvent): Promise<void> {
    const [success, info, state] = this.deserializer(e.state);
    const playerInfo = JSON.parse(info) as CombinedInfo;
    this.client.updateState({state}, playerInfo);
    return Promise.resolve();
  }

  public onRequest(e: ClientSyncRequestEvent): Promise<string> {
    if (e.key === remoteCallId) {
      return this.responder.onValidationRequest(e.message);
    }
    else {
      // Throw some sort of exception for failed server message
      return Promise.resolve(failureId);
    }
  }

  public onClose(e: ClientSyncCloseEvent): void {
    const onClose = this.client.onClose;
    if (onClose) {
      this.client.onClose!(e);
    }
  }
}

export interface Client<T> {

  updateState(e: ClientSyncStateEvent, info: CombinedInfo): void;

  getRemote(): T;

  onClose?(e: ClientSyncCloseEvent): void;
}
