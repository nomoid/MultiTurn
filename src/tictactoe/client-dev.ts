import './helper/logging.js';

import '../multiturn/helper/loglevel-prefix-name';

import * as log from 'loglevel';

// Set the proper level before all of the other imports
log.setLevel(log.levels.DEBUG);

import * as sio from 'socket.io-client';
import { ClientGameResponder, defaultClientSyncLayer } from '../multiturn/game/client';
import { defaultSerializer, defaultDeserializer } from '../multiturn/sio-network/serializer';
import Remote from './remote-dev';

const io = sio();

const serializer = defaultSerializer('$');
const deserializer = defaultDeserializer('$');

function attachHandler() {
  const requestId = '_request';
  const responseId = '_response';
  const requestButton = document.getElementById('sio-request');
  const responseButton = document.getElementById('sio-response');
  const latestResponseButton = document.getElementById('sio-latest-response');
  const keyInput = document.
    getElementById('sio-key-input') as HTMLInputElement;
  const messageInput = document.
    getElementById('sio-message-input') as HTMLInputElement;
  if (requestButton && responseButton && latestResponseButton) {
    let lastKey: string;
    // Extract the key to be used with the latest response button
    io.on(requestId, (value: string) => {
      const [success, key, message] = deserializer(value);
      if (success) {
        lastKey = key;
      }
    });
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
    latestResponseButton.onclick = (e) => {
      if (lastKey) {
        const key = lastKey;
        const message = messageInput.value;
        io.emit(responseId, serializer(key, message));
      }
    };
  }
}

function main() {
  attachHandler();
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(new Remote()));
  layer.listen();
}

main();
