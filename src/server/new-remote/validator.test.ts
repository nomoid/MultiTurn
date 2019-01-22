import Move from './test/move';
import Player from './test/player';
import RemoteValidator from './validator';

const path = './src/server/new-remote/validator.test.ts';

class TestGetter {
  public fun!: (s: string) => Promise<string>;

  public get(s: string): Promise<string> {
    return this.fun(s);
  }
}

const getter = new TestGetter();
const remote = new RemoteValidator(getter.get.bind(getter), path);
const getMove = remote.call(Player.prototype.getMove);

test('testValidator', async () => {
  const move = new Move(1, 1);
  const moveSupplier = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve(JSON.stringify(move));
  };
  getter.fun = moveSupplier;
  await expect(getMove()).resolves.toEqual(move);
});

test('testValidatorFailMaximum', async () => {
  const move = new Move(1, 3);
  const moveSupplier = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve(JSON.stringify(move));
  };
  getter.fun = moveSupplier;
  await expect(getMove()).rejects.toBeDefined();
});

test('testValidatorFailType', async () => {
  const moveSupplier = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve(JSON.stringify({x: 1, y: 'hi'}));
  };
  getter.fun = moveSupplier;
  await expect(getMove()).rejects.toBeDefined();
});

test('testValidatorMissingProperty', async () => {
  const moveSupplier = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve(JSON.stringify({x: 1}));
  };
  getter.fun = moveSupplier;
  await expect(getMove()).rejects.toBeDefined();
});

test('testValidatorExtraProperty', async () => {
  const moveSupplier = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve(JSON.stringify({x: 1, y: 1, z: 1}));
  };
  getter.fun = moveSupplier;
  await expect(getMove()).rejects.toBeDefined();
});

test('testValidatorNotJSON', async () => {
  const moveSupplier = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve('x:1,y:1');
  };
  getter.fun = moveSupplier;
  await expect(getMove()).rejects.toBeDefined();
});

test('testValidatorEmpty', async () => {
  const moveSupplier = (key: string) => {
    if (key !== 'Player.getMove') {
      throw Error('Incorrect name');
    }
    return Promise.resolve('');
  };
  getter.fun = moveSupplier;
  await expect(getMove()).rejects.toBeDefined();
});
