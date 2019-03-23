import '../multiturn/helper/loglevel-prefix-name';

import * as log from 'loglevel';

// Set the proper level before all of the other imports
log.setLevel(log.levels.DEBUG);

import * as sio from 'socket.io-client';
import '../../public/styles.css';
import { clearLocalToken } from '../multiturn/auth-network/client/cookie';
import { ClientGameResponder, defaultClientSyncLayer } from '../multiturn/game/client';
import Board, { boardCache } from './board';
import Move from './move';
import Remote from './remote';
import { Space, Coordinate } from './rules';

const io = sio();
const remote = new Remote();

let highlighted: Coordinate | undefined;

function main() {
  attachHandler();
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(remote));
  layer.listen();
}

function attachHandler() {
  const leave = document.getElementById('leave-button') as HTMLButtonElement;
  const buttonArray: HTMLButtonElement[][] = [];
  const buttons = document.getElementsByClassName('chess-button');
  for (let i = 0; i < 8; i++) {
    buttonArray.push([]);
    for (let j = 0; j < 8; j++) {
      buttonArray[i].push(buttons.item(0) as HTMLButtonElement);
    }
  }
  const updateState = (state: Board) => {
    state.getCache().clearCache();
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        buttonArray[x][y].style.backgroundImage = icon(state.spaces[x][y]);
      }
    }
    const info = remote.getLatestInfo()!;
    if (info.gameOver) {
      clearLocalToken();
    }
    if (info.turn > 0) {
      leave.hidden = false;
    }
  };
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons.item(i) as HTMLButtonElement;
    if (button) {
      const value = button.name;
      const file = value.charCodeAt(0) - 97;
      const rank = value.charCodeAt(1) - 49;
      buttonArray[file][rank] = button;
      button.onclick = (e) => {
        if (!remote.isCurrentTurn()) {
          return;
        }
        const coord: Coordinate = [file, rank];
        if (highlighted && remote.isValidMove(highlighted, coord)) {
          clearHighlighting(buttonArray);
          const [startFile, startRank] = highlighted;
          // Simulate move locally
          const board = remote.getState();
          board.tryMove(remote.getColor(),
            [startFile, startRank], [file, rank]);
          updateState(board);
          // Sends move to remote
          remote.resolveMove(new Move(startFile, startRank, file, rank));
          highlighted = undefined;
        }
        else if (remote.hasOwnPiece(coord)) {
          clearHighlighting(buttonArray);
          highlighted = coord;
          button.style.backgroundColor = 'lightblue';
          // Look for potential moves
          const moves = remote.getValidMoves(coord);
          for (const move of moves) {
            const [moveFile, moveRank] = move;
            const targetButton = buttonArray[moveFile][moveRank];
            targetButton.style.backgroundColor = 'lightgreen';
          }
        }
      };
    }
  }
  remote.addStateListener(updateState);
  const label = document.getElementById('header-output');
  if (label) {
    remote.addMessageListener((message: string) => {
      label.innerHTML = message;
    });
  }
  leave.onclick = () => {
    clearLocalToken();
    location.reload();
  };
}

function clearHighlighting(buttonArray: HTMLButtonElement[][]) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      buttonArray[i][j].style.backgroundColor = '';
    }
  }
}

function icon(space: Space) {
  if (!space) {
    return '';
  }
  else {
    const [color, piece] = space;
    return `url('assets/chess/${color}_${piece}.png')`;
  }
}

function convertToSymbol(space: Space) {
  if (!space) {
    return '&nbsp;';
  }
  else {
    const [color, piece] = space;
    let text = '';
    if (color === 'white') {
      text += 'w';
    }
    else {
      text += 'b';
    }
    switch (piece) {
      case 'pawn':
        text += 'P';
        break;
      case 'rook':
        text += 'R';
        break;
      case 'knight':
        text += 'N';
        break;
      case 'bishop':
        text += 'B';
        break;
      case 'queen':
        text += 'Q';
        break;
      case 'king':
        text += 'K';
        break;
    }
    return text;
  }
}

main();
