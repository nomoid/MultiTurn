import * as logger from 'loglevel';
import AuthServerNetworkLayer from '../auth-network/server/layer';
import { NetworkLayer, Socket, ConnectionEvent, RequestEvent } from '../network/network';
import { Serializer, Deserializer } from '../sio-network/serializer';
import OverflowNetworkLayer from './layer';

type AuthLayerInfo = [AuthServerNetworkLayer, OverflowNetworkLayer];

const log = logger.getLogger('AuthMux');

const registerId = '_register';
const loginId = '_login';
const refreshId = '_refresh';
const loginFailId = '_login_fail';
const refreshFailId = '_refresh_fail';

export default class AuthOverflowMultiplexer {

  private registered: Set<Socket> = new Set();
  private userCache: Map<string, AuthLayerInfo> = new Map();
  private layers: AuthLayerInfo[] = [];
  private listening: boolean = false;

  public constructor(private network: NetworkLayer,
    private overflowCount: number,
    private layerRunner: (layer: AuthServerNetworkLayer) => void,
    private serializer?: Serializer,
    private deserializer?: Deserializer) {
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.network.addConnectionListener((e: ConnectionEvent) => {
      const socket = e.accept();
      socket.addRequestListener(this.handleRequest(socket).bind(this));
    });
    this.network.listen();
  }

  private register(socket: Socket, e: RequestEvent) {
    if (this.registered.has(socket)) {
      return;
    }
    this.registered.add(socket);
    let layer!: AuthServerNetworkLayer;
    let overflow = false;
    if (this.layers.length === 0) {
      overflow = true;
    }
    else {
      const [latest, net] = this.layers[this.layers.length - 1];
      layer = latest;
      const users = latest.getUsers();
      if (users.size === this.overflowCount) {
        overflow = true;
      }
      else {
        net.fireEvent(socket);
      }
    }
    if (overflow) {
      // Make a new auth layer
      const net = new OverflowNetworkLayer(this);
      layer = new AuthServerNetworkLayer(net,
        this.serializer, this.deserializer);
      this.layerRunner(layer);
      this.layers.push([layer, net]);
      net.fireEvent(socket);
    }
    layer.register(socket, e);
    this.refreshCache();
  }

  private login(socket: Socket, e: RequestEvent) {
    const info = this.userCache.get(e.message);
    if (info) {
      const [layer, net] = info;
      layer.login(socket, e);
    }
    else {
      e.respond(loginFailId);
    }
  }

  private refresh(socket: Socket, e: RequestEvent) {
    const info = this.userCache.get(e.message);
    if (info) {
      const [layer, net] = info;
      layer.refresh(socket, e);
    }
    else {
      e.respond(refreshFailId);
    }
  }

  private handleUserRequest(socket: Socket, e: RequestEvent) {
    const [layer, net] = this.userCache.get(e.key)!;
    layer.handleUserRequest(socket, e);
  }

  private handleRequest(socket: Socket) {
    return (e: RequestEvent) => {
      if (e.key === registerId) {
        this.register(socket, e);
      }
      else if (e.key === loginId) {
        this.login(socket, e);
      }
      else if (e.key === refreshId) {
        this.refresh(socket, e);
      }
      else if (this.userCache.has(e.key)) {
        this.handleUserRequest(socket, e);
      }
    };
  }

  private refreshCache() {
    this.userCache.clear();
    for (const [layer, net] of this.layers) {
      const users = layer.getUsers();
      log.warn(JSON.stringify(users.size));
      for (const userId of users.keys()) {
        this.userCache.set(userId, [layer, net]);
      }
    }
  }
}
