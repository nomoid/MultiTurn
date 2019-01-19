import SIOClientNetworkLayer from '../sio-network/client/layer';
import { testNetworkLayer } from '../sio-network/layer.test';
import SIOServerNetworkLayer from '../sio-network/server/layer';
import { SIOServer, SIOSocket } from '../sio-network/sio-external';
import AuthClientNetworkLayer from './client/layer';
import AuthServerNetworkLayer from './server/layer';

test('testAuthLayer', () => {
  return testNetworkLayer((server: SIOServer) => {
    return new AuthServerNetworkLayer(new SIOServerNetworkLayer(server));
  }, (client: SIOSocket) => {
    return new AuthClientNetworkLayer(new SIOClientNetworkLayer(client));
  });
});
