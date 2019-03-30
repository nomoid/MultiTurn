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
import { Root } from './components/root';
import Move from './move';
import Remote from './remote';
import { Space, Coordinate } from './rules';

const refreshDelay = 0;

const io = sio();
const remote = new Remote();

const buttonArray: HTMLButtonElement[][] = [];
let highlighted: Coordinate | undefined;
let inverted = false;

function main() {
  reactRender();
  preloadImages();
  attachHandler();
  const layer = defaultClientSyncLayer(io, new ClientGameResponder(remote),
    refreshDelay);
  layer.listen();
}

function reactRender() {
  ReactDOM.render(Root({
    roomOutput: '',
    headerOutput: '',
    boardState: remote.getState(),
    remoteColor: remote.getColor() || 'white',
    isCurrentTurn: remote.isCurrentTurn(),
    resolveMove: remote.resolveMove.bind(remote),
    setNewBoard: (board: Board) => {
      // TODO
    }
  }), document.getElementById('root'));
}

function attachHandler() {
  const leave = document.getElementById('leave-button') as HTMLButtonElement;
  const buttons = document.getElementsByClassName('chess-button');
  for (let i = 0; i < 8; i++) {
    buttonArray.push([]);
    for (let j = 0; j < 8; j++) {
      buttonArray[i].push(buttons.item(0) as HTMLButtonElement);
    }
  }
  const invertBoard = document.getElementById(
    'invert-board') as HTMLInputElement;
  invertBoard.onclick = (e) => {
    updateState(remote.getState());
    updateHighlighting(highlightMoves.checked, chessboardColors.checked);
  };
  const highlightMoves = document.getElementById(
    'highlight-moves') as HTMLInputElement;
  highlightMoves.onclick = (e) => {
    updateHighlighting(highlightMoves.checked, chessboardColors.checked);
  };
  const chessboardColors = document.getElementById(
    'chessboard-colors') as HTMLInputElement;
  chessboardColors.onclick = (e) => {
    updateHighlighting(highlightMoves.checked, chessboardColors.checked);
  };
  const roomOutput = document.getElementById('room-output')!;
  const loading = document.getElementById('loading')!;
  const content = document.getElementById('main-content')!;
  const closedDiv = document.getElementById('closed')!;
  const updateState = (state: Board) => {
    loading.hidden = true;
    closedDiv.hidden = true;
    content.hidden = false;
    const roomCode = parseInt(remote.getState().boardId, 16).toString();
    const roomCodeDisplay = roomCode.substring(
      0, Math.min(4, roomCode.length));
    roomOutput.innerHTML = `Room ${roomCodeDisplay}`;
    inverted = invertBoard.checked && remote.getColor() === 'black';
    state.getCache().clearCache();
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const adjustedX = adj(x);
        const adjustedY = adj(y);
        buttonArray[adjustedX][adjustedY].style.backgroundImage =
          icon(state.spaces[x][y]);
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
      const constFile = value.charCodeAt(0) - 97;
      const constRank = value.charCodeAt(1) - 49;
      buttonArray[constFile][constRank] = button;
      button.onclick = (e) => {
        const file = adj(constFile);
        const rank = adj(constRank);
        if (!remote.isCurrentTurn()) {
          return;
        }
        const coord: Coordinate = [file, rank];
        if (highlighted && remote.isValidMove(highlighted, coord)) {
          const [startFile, startRank] = highlighted;
          // Simulate move locally
          const board = remote.getState();
          board.tryMove(remote.getColor()!,
            [startFile, startRank], [file, rank]);
          updateState(board);
          // Sends move to remote
          remote.resolveMove(new Move(startFile, startRank, file, rank));
          highlighted = undefined;
          updateHighlighting(highlightMoves.checked, chessboardColors.checked);
        }
        else if (remote.hasOwnPiece(coord)) {
          highlighted = coord;
          updateHighlighting(highlightMoves.checked, chessboardColors.checked);
        }
      };
    }
  }
  remote.addStateListener(updateState);
  remote.addCloseListener((reason?: string) => {
    loading.hidden = true;
    content.hidden = true;
    closedDiv.hidden = false;
  });
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
  clearHighlighting(chessboardColors.checked);
}

function adj(num: number) {
  if (inverted) {
    return 7 - num;
  }
  else {
    return num;
  }
}

function selectColorForSpace(i: number, j: number, fancyColors: boolean) {
  return 'gray';
}

function highlightColorForSpace(i: number, j: number, fancyColors: boolean) {
  if (!fancyColors) {
    return 'skyblue';
  }
  return colorForSpace('#87cefa', '#659abb', i, j);
}

function backgroundColorForSpace(i: number, j: number, fancyColors: boolean) {
  if (!fancyColors) {
    return 'white';
  }
  return colorForSpace('#ffce9e', '#d18b47', i, j);
}

function colorForSpace(light: string, dark: string, i: number, j: number) {
  if ((i + j) % 2 === 0) {
    return dark;
  }
  else {
    return light;
  }
}

function clearHighlighting(fancyColors: boolean) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      buttonArray[i][j].style.backgroundColor =
        backgroundColorForSpace(i, j, fancyColors);
    }
  }
}

function updateHighlighting(toHighlight: boolean, fancyColors: boolean) {
  clearHighlighting(fancyColors);
  if (highlighted) {
    const [file, rank] = highlighted;
    const button = buttonArray[adj(file)][adj(rank)];
    button.style.backgroundColor = selectColorForSpace(file, rank, fancyColors);
    if (toHighlight) {
      // Look for potential moves
      const moves = remote.getValidMoves(highlighted);
      for (const move of moves) {
        const [moveFile, moveRank] = move;
        const targetButton = buttonArray[adj(moveFile)][adj(moveRank)];
        targetButton.style.backgroundColor =
          highlightColorForSpace(moveFile, moveRank, fancyColors);
      }
    }
  }
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

function icon(space: Space) {
  if (!space) {
    return '';
  }
  else {
    const [color, piece] = space;
    return `url('${imageLoc(color, piece)}')`;
  }
}

function imageLoc(color: string, piece: string) {
  return `assets/chess/${color}_${piece}.png`;
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
