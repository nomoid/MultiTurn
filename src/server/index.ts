import * as path from 'path';
import Move from './move';
import Player from './new-remote/player';
import { RemoteResponder } from './new-remote/responder';
import RemoteValidator from './new-remote/validator';

async function main() {
  console.log('Starting');
  /*
  const getter = (key: string) => {
    console.log(key);
    const output = JSON.stringify(new Move(1, 1));
    return Promise.resolve('{"x":1,"y":1}');
  };
  */
  console.log('Setting up remote responder...');
  const player = new Player();
  const responder = new RemoteResponder(player);

  console.log('Setting up remote validator...');
  const getter = responder.onValidationRequest.bind(responder);
  const remote = new RemoteValidator(getter, './src/server/index.ts');
  // remote.addTypeValidator(Move);

  console.log('Setting up remote call...');
  const getMove = remote.flatCall(Player.prototype.getDelayedMove);

  console.log('Finished setting up');
  for (let i = 0; i < 10; i++) {
    const move = await getMove();
    console.log(move);
  }
  console.log('Done');
}

main();
