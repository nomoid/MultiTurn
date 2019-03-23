import AuthOverflowMultiplexer from '../auth-mux/overflow';
import AuthServerNetworkLayer from '../auth-network/server/layer';
import RepeatServerSyncLayer from '../repeat-sync/server/layer';
import { defaultSerializer, defaultDeserializer } from '../sio-network/serializer';
import SIOServerNetworkLayer from '../sio-network/server/layer';
import { SIOServer } from '../sio-network/sio-external';
import UniversalStateManager from '../state/universal';
import { ServerSyncLayer } from '../sync/server';
import Player from './player';
import { ServerOptions } from './server';

export function defaultSyncLayer(io: SIOServer): RepeatServerSyncLayer {
  const netLayer = new SIOServerNetworkLayer(io);
  const authLayer = new AuthServerNetworkLayer(netLayer);
  const stateManager = new UniversalStateManager('');
  const syncLayer = new RepeatServerSyncLayer(authLayer, stateManager);
  return syncLayer;
}

export function defaultStateMask<R, T>():
    (state: T, player: Player<R>) => string {
  return (state, _) => {
    return JSON.stringify(state);
  };
}

// User needs to pass in io
export function defaultOptions<R, T>(io?: SIOServer): ServerOptions<R, T> {
  let layer: ServerSyncLayer;
  if (io) {
    layer = defaultSyncLayer(io);
  }
  const def: ServerOptions<R, T> = {
    syncLayer: layer!,
    maxPlayers: 2,
    stateMask: defaultStateMask(),
    typePath: './src/typepath.ts',
    standardTurns: true,
    cacheTypes: false,
    serializer: defaultSerializer('~'),
    deserializer: defaultDeserializer('~'),
    fullCallback: () => Promise.resolve()
  };
  return def;
}

export function fillDefault<R, T>(options: Partial<ServerOptions<R, T>>,
    io?: SIOServer): ServerOptions<R, T> {
  const def = defaultOptions(io);
  const filled = {...def, ...options};
  if (!filled.syncLayer) {
    throw new Error('SIOServer argument needs to be passed in if syncLayer' +
      'is not being supplied!');
  }
  return filled;
}

export function makeDefaultWithRefresh<R, T>(options: Partial<ServerOptions<R, T>>,
    io: SIOServer, optionCallback: (options: ServerOptions<R, T>) => void):
    AuthOverflowMultiplexer {
  const netLayer = new SIOServerNetworkLayer(io);
  const authMux = new AuthOverflowMultiplexer(netLayer, 2,
      (authLayer: AuthServerNetworkLayer) => {
    const stateManager = new UniversalStateManager('');
    const syncLayer = new RepeatServerSyncLayer(authLayer, stateManager);
    const def = defaultOptions();
    def.syncLayer = syncLayer;
    const filled = {...def, ...options};
    optionCallback(filled);
  });
  return authMux;
}
