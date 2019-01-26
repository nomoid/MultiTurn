import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import Player from '../client/player';
import AuthServerNetworkLayer from '../multiturn/auth-network/server/layer';
import { Socket } from '../multiturn/network/network';
import SIOServerNetworkLayer from '../multiturn/sio-network/server/layer';
import RemoteValidator from './new-remote/validator';
import Board from './tictactoe/board';
import Move from './tictactoe/move';

const app = express();

const clientPath = `${__dirname}/../../dist`;
app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

const updateStateId = '_updateState';
const getRemoteId = '_getRemote';
const gameEndId = '_gameEnd';
const winId = 'win';
const loseId = 'lose';
const tieId = 'tie';

const players: RemoteValidator[] = [];
const sockets: Socket[] = [];
const maxPlayers = 2;
let currentPlayer = 0;
const board = new Board();

const netLayer = new SIOServerNetworkLayer(io);
const authLayer = new AuthServerNetworkLayer(netLayer);
authLayer.addConnectionListener((e) => {
  console.log('Player joined');
  const sock = e.accept();
  sockets.push(sock);
  const getter = async (msg: string) => {
    await sock.request(updateStateId, JSON.stringify(board));
    return await sock.request(getRemoteId, msg);
  };
  const remote = new RemoteValidator(getter, './src/server/index.ts');
  players.push(remote);
  if (players.length === maxPlayers) {
    startServer();
  }
});
authLayer.listen();

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log('Server started on ' + port);
});

function updateState(socket: Socket) {
  console.log('Updating state...');
  return socket.request(updateStateId, JSON.stringify(board));
}

function sendVictory(player: number) {
  for (let i = 0; i < maxPlayers; i++){
    const socket = sockets[i];
    if (i === player) {
      socket.request(gameEndId, winId);
    }
    else {
      socket.request(gameEndId, loseId);
    }
  }
}

function sendTie() {
  for (let i = 0; i < maxPlayers; i++){
    const socket = sockets[i];
    socket.request(gameEndId, tieId);
  }
}

async function startServer() {
  console.log('Starting server');
  console.log('debug');
  try {
    while (true) {
      const promises: Array<Promise<any>> = [];
      for (let i = 0; i < maxPlayers; i++){
        if (i === currentPlayer) {
          continue;
        }
        promises.push(updateState(sockets[i]));
      }
      promises.push(main());
      const done = await Promise.all(promises);
      if (done[promises.length - 1]) {
        break;
      }
      currentPlayer += 1;
      currentPlayer %= maxPlayers;
    }
  }
  catch (e) {
    throw e;
  }
  console.log('Completed!');
}

async function main(): Promise<boolean> {
  console.log(`Starting turn for Player ${currentPlayer}`);
  const player = players[currentPlayer];
  const getDelayedMove = player.flatCall(Player.prototype.getMove);
  let valid = false;
  let move: Move;
  do {
    console.log('Waiting for move...');
    move = await getDelayedMove();
    console.log(`Got move ${JSON.stringify(move)}`);
    if (!board.occupied(move)) {
      valid = true;
      console.log('Move valid.');
    }
    else {
      console.log('Move invalid. Retrying!');
    }
  }
  while (!valid);
  board.occupy(move, currentPlayer);
  const win = board.checkVictory();
  if (win >= 0) {
    console.log(`Victory for Player ${currentPlayer}`);
    sendVictory(currentPlayer);
    return true;
  }
  else {
    const tie = board.checkTie();
    if (tie) {
      console.log('Game is tied');
      sendTie();
      return true;
    }
    else {
      console.log('No victory. Continuing');
      return false;
    }
  }
}
