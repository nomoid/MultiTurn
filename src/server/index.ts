import * as path from 'path';
import Move from './move';
import Player from './new-remote/player';
import Remote from './new-remote/wrapper';

async function main() {
  console.log('Starting');
  const getter = (key: string) => {
    console.log(key);
    return Promise.resolve(JSON.stringify(new Move(1, 1)));
  };
  const remote = new Remote(getter);
  remote.addTypeValidator(Move, './src/server/move.ts');
  const remoteCaller = remote.call(Player.prototype.getMove);
  const move = await remoteCaller();
  console.log(move);
  console.log('Done');
}

main();
