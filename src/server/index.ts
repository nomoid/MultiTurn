import * as path from 'path';
import Player from './new-remote/player';
import remoteCall from './new-remote/wrapper';

async function main() {
  console.log('Starting');
  const remoteCaller = remoteCall(Player.prototype.getMove, './src/server/move.ts');
  const move = await remoteCaller();
  console.log(move);
  console.log('Done');
}

main();
