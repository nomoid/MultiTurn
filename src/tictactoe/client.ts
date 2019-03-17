import '../multiturn/helper/loglevel-prefix-name';

import * as log from 'loglevel';

// Set the proper level before all of the other imports
log.setLevel(log.levels.DEBUG);

import * as sio from 'socket.io-client';
import { ClientGameResponder, defaultClientSyncLayer } from '../multiturn/game/client';
import Remote from './remote';
import Board from './board';

const io = sio();
const remote = new Remote();

function convert(i: number): string {
  if (i < 0) {
    return '_';
  }
  else if (i === 1) {
    return 'X';
  }
  else if (i === 2) {
    return 'O';
  }
  else {
    return 'I';
  }
}

function attachHandler() {
  const buttonArray: HTMLButtonElement[][] = [[], [], []];
  const buttons = document.getElementsByClassName('ttt-button');
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons.item(i) as HTMLButtonElement;
    if (button) {
      const value = button.name;
      const x = parseInt(value[0], 10);
      const y = parseInt(value[2], 10);
      buttonArray[x].push(button);
      button.onclick = (e) => remote.resolveMove(x, y);
    }
  }
  remote.addStateListener((state: Board) => {
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        buttonArray[x][y].innerHTML = convert(state.spaces[x][y]);
      }
    }
  });
}

function main() {
  attachHandler();
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(remote));
  layer.listen();
}

main();
