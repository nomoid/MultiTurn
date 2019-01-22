import Move from './test/move';
import Player from './test/player';
import RemoteValidator from './validator';

const path = './src/server/new-remote/validator.test.ts';

test('testValidator', () => {
  expect.assertions(1);

  const move = new Move(1, 1);
  const getter = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve(JSON.stringify(move));
  };
  const remote = new RemoteValidator(getter, path);
  const getMove = remote.call(Player.prototype.getMove);
  return expect(getMove()).resolves.toEqual(move);
});

test('testFailMaximum', () => {
  expect.assertions(1);

  const move = new Move(1, 3);
  const getter = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve(JSON.stringify(move));
  };
  const remote = new RemoteValidator(getter, path);
  const getMove = remote.call(Player.prototype.getMove);
  return expect(getMove()).rejects.toBeDefined();
});
