import * as path from 'path';
import Move from './move';
import Player from './new-remote/player';
import RemoteValidator from './new-remote/validator';

async function main() {
  console.log('Starting');
  const getter = (key: string) => {
    console.log(key);
    const output = JSON.stringify(new Move(1, 1));
    return Promise.resolve('{"x":1,"y":3}');
  };
  const remote = new RemoteValidator(getter, './src/server/index.ts');
  // remote.addTypeValidator(Move);
  const getMove = remote.call(Player.prototype.getMove);
  const move = await getMove();
  console.log(move);
  console.log('Done');
}

main();
