import './helper/logging.js';

import * as log from 'loglevel';
import * as sio from 'socket.io-client';
import { ClientGameResponder, defaultClientSyncLayer } from '../multiturn/game/client';
import '../multiturn/helper/loglevel-prefix-name';
import { defaultSerializer } from '../multiturn/sio-network/serializer';
import Remote from './remote';

const io = sio();

const serializer = defaultSerializer('$');

function attachHandler() {
  const requestId = '_request';
  const responseId = '_response';
  const requestButton = document.getElementById('sio-request');
  const responseButton = document.getElementById('sio-response');
  const keyInput = document.
    getElementById('sio-key-input') as HTMLInputElement;
  const messageInput = document.
    getElementById('sio-message-input') as HTMLInputElement;
  if (requestButton && responseButton) {
    requestButton.onclick = (e) => {
      const key = keyInput.value;
      const message = messageInput.value;
      io.emit(requestId, serializer(key, message));
    };
    responseButton.onclick = (e) => {
      const key = keyInput.value;
      const message = messageInput.value;
      io.emit(responseId, serializer(key, message));
    };
  }
}

function main() {
  attachHandler();
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(new Remote()));
  layer.listen();
}

main();
