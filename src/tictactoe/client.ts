import * as sio from 'socket.io-client';
import { defaultClientSyncLayer, ClientGameResponder, Client } from '../multiturn/game/client';
import './helper/logging.js';
import Remote from './remote';

const io = sio();

function main() {
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(
    new Remote()));
  layer.listen();
}

main();
