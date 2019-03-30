import '../multiturn/helper/loglevel-prefix-name';

import * as log from 'loglevel';

// Set the proper level before all of the other imports
log.setLevel(log.levels.DEBUG);

import * as ReactDOM from 'react-dom';
import * as sio from 'socket.io-client';
import '../../public/chess/styles.css';
import { clearLocalToken } from '../multiturn/auth-network/client/cookie';
import { ClientGameResponder, defaultClientSyncLayer } from '../multiturn/game/client';
import Board, { boardCache } from './board';
import { Root, Scene } from './components/root';
import Move from './move';
import Remote from './remote';
import { Space, Coordinate } from './rules';

const refreshDelay = 0;

const io = sio();
const remote = new Remote();

function main() {
  preloadImages();
  attachHandler();
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(remote),
    refreshDelay);
  layer.listen();
}

function reactRender(updater: (board: Board) => void, state: Board,
    scene: Scene, started: boolean, roomOutput: string, headerOutput: string) {
  ReactDOM.render(Root({
    scene,
    started,
    roomOutput,
    headerOutput,
    boardState: state,
    remoteColor: remote.getColor() || 'white',
    isCurrentTurn: remote.isCurrentTurn(),
    resolveMove: remote.resolveMove.bind(remote),
    setNewBoard: (board: Board) => {
      updater(board);
    }
  }), document.getElementById('root'));
}

function attachHandler() {
  let closed = false;
  let headerOutput = '';
  const updateState = (state: Board) => {
    if (closed) {
      reactRender(updateState, state, 'closed', true, '', '');
      return;
    }
    let started = false;
    const roomCode = parseInt(state.boardId, 16).toString();
    const roomCodeDisplay = roomCode.substring(
      0, Math.min(4, roomCode.length));
    const roomOutput = `Room ${roomCodeDisplay}`;
    state.getCache().clearCache();
    const info = remote.getLatestInfo()!;
    if (info.gameOver) {
      clearLocalToken();
    }
    if (info.turn > 0) {
      started = true;
    }
    reactRender(updateState, state, 'content', started, roomOutput,
      headerOutput);
  };
  remote.addStateListener(updateState);
  remote.addMessageListener((msg: string) => {
    headerOutput = msg;
    updateState(remote.getState());
  });
  remote.addCloseListener((reason?: string) => {
    closed = true;
    updateState(remote.getState());
  });
  reactRender(updateState, remote.getState(), 'loading', false, '', '');
}

const images: Map<string, HTMLImageElement> = new Map();

function preloadImages() {
  images.clear();
  const colors = ['white', 'black'];
  const pieces = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
  for (const color of colors) {
    for (const piece of pieces) {
      const loc = imageLoc(color, piece);
      const image = new Image();
      image.src = loc;
      // Add image to dictionary to ensure it doesn't get garbage collected
      images.set(loc, image);
    }
  }
}

function imageLoc(color: string, piece: string) {
  return `assets/chess/${color}_${piece}.png`;
}

main();
