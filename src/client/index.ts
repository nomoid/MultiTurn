import * as sio from 'socket.io-client';
import { defaultClientSyncLayer, ClientGameResponder, Client } from '../multiturn/game/client';
import Remote from '../server/tictactoe-new/remote';

const io = sio();

function main() {
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(
    new Remote()));
  layer.listen();
}

main();
