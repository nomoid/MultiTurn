import * as Cookie from 'js-cookie';
import * as sio from 'socket.io-client';
import AuthClientNetworkLayer from '../multiturn/auth-network/client/layer';
import { ConnectionEvent, RequestEvent } from '../multiturn/network/network';
import SIOClientNetworkLayer from '../multiturn/sio-network/client/layer';
import { RemoteResponder } from '../server/new-remote/responder';
import Board from '../server/tictactoe/board';
import Player from './player';

const io = sio();
const authTokenId = 'auth.token';

const updateStateId = '_updateState';
const getRemoteId = '_getRemote';
const gameEndId = '_gameEnd';
const winId = 'win';
const loseId = 'lose';

let state = new Board();

function main() {
  console.log('Starting client');
  const localToken = Cookie.get(authTokenId);
  if (localToken) {
    console.log(`Local token found ${localToken}`);
  }
  else {
    console.log('No local token found, requesting new token');
  }
  const responder = new RemoteResponder();
  const netLayer = new SIOClientNetworkLayer(io);
  const authLayer = new AuthClientNetworkLayer(netLayer, localToken);
  const player = new Player();
  responder.addResponder(player);
  authLayer.addConnectionListener((e: ConnectionEvent) => {
    const socket = e.accept();
    const remoteToken = authLayer.token!;
    Cookie.set(authTokenId, remoteToken);
    socket.addRequestListener((e2: RequestEvent) => {
      console.log(`Request: ${e2.message}`);
      if (e2.key === updateStateId) {
        state = JSON.parse(e2.message) as Board;
        e2.respond('');
      }
      else if (e2.key === getRemoteId) {
        responder.onValidationRequest(e2.message).then((s: string) => {
          e2.respond(s);
        });
      }
      else if (e2.key === gameEndId) {
        if (e2.message === winId) {
          console.log('You win!');
        }
        else {
          console.log('You lose');
        }
        e2.respond('');
      }
      else {
        console.log(`Invalid key: ${e2.key}`);
      }
    });
  });
  authLayer.listen();
}

main();
