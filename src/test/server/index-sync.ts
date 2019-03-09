import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import AuthServerNetworkLayer from '../../multiturn/auth-network/server/layer';
import RepeatServerSyncLayer from '../../multiturn/repeat-sync/server/layer';
import SIOServerNetworkLayer from '../../multiturn/sio-network/server/layer';
import UniversalStateManager from '../../multiturn/state/universal';

const app = express();

const clientPath = `${__dirname}/../../dist`;
app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

const players = 2;
const maxTurns = 10;

const requestFunctions: {[index: string]: (x: number) => number} = {
  increment: (x: number) => x + 1,
  double: (x: number) => x * 2
};
const requests = Object.keys(requestFunctions);

let currentPlayer = 0;
let turn = 0;

function pickRandom<T>(arr: T[]): T {
  const n = Math.floor(Math.random() * arr.length);
  return arr[n];
}

async function startGame() {
  console.log('Game started!');
  while (turn < maxTurns) {
    const users = syncLayer.getUsers();
    const player = users[currentPlayer];
    const currState = stateManager.getState(player.id);
    const request = pickRandom(requests);
    const response = player.request('response', request);
    console.log(`Request ${request} sent to player ${turn}`);
    const result = await response.result!;
    const requestFunc = requestFunctions[request];
    if (!requestFunc) {
      throw new Error(`Function ${request} not found`);
    }
    const expected = requestFunc(parseInt(currState, 10)).toString();
    if (expected === result) {
      console.log(`Player ${currentPlayer} returned correct response`);
    }
    else {
      console.log(`Player ${currentPlayer} expected response: ${expect},` +
          ` actual response: ${result}`);
    }
    stateManager.setState(result);
    turn += 1;
    currentPlayer += 1;
    currentPlayer %= players;
  }
  console.log('Game over!');
}

const netLayer = new SIOServerNetworkLayer(io);
const authLayer = new AuthServerNetworkLayer(netLayer);
const stateManager = new UniversalStateManager('1');
const syncLayer = new RepeatServerSyncLayer(authLayer, stateManager);
stateManager.addUserListener((userEvent) => {
  let userCount = syncLayer.getUsers().length;
  if (userCount >= players) {
    userEvent.reject();
    console.log('Player count already full, rejecting join request');
    return;
  }
  const user = userEvent.accept();
  userCount += 1;
  console.log(`Player with id ${user.id} joined`);
  console.log(`Number of players: ${userCount}`);
  if (userCount === players) {
    startGame();
  }
});
syncLayer.listen();

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log('Server started on ' + port);
});
