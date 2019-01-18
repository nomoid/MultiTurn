import { ConnectionEvent, RequestEvent } from '../network/network';
import SIOClientNetworkLayer from './client/layer';
import MockSIOServer from './mock/server';
import SIOServerNetworkLayer from './server/layer';
import { SIOSocket } from './sio-external';

test('testMockSIO', (done) => {
  const testKey1 = '$$$$';
  const testKey2 = '$$';
  const testValue1 = '$$$';
  const testValue2 = '$$$$$';

  expect.assertions(2);

  const server = new MockSIOServer();
  server.on('connection', (socket: SIOSocket) => {
    socket.on(testKey1, (message: string) => {
      expect(message).toEqual(testValue1);
      socket.emit(testKey2, testValue2);
    });
  });
  const client = server.connect();
  client.on(testKey2, (message: string) => {
    expect(message).toEqual(testValue2);
    done();
  });
  server.listen();
  client.emit(testKey1, testValue1);
});

function randomChar(): string {
  // Minimum ascii value, inclusive
  const alphaMin = 32;
  // Maximum ascii value, exclusive
  const alphaMax = 127;
  const charCode =
    Math.floor(Math.random() * (alphaMax - alphaMin)) + alphaMin;
  return String.fromCharCode(charCode);
}

function randomString(): string {
  // Generate a random length
  const minLength = 0;
  const maxLength = 20;
  const length =
    Math.floor(Math.random() * (maxLength - minLength)) + minLength;
  let s = '';
  for (let i = 0; i < length; i++) {
    s += randomChar();
  }
  return s;
}

function randomData(length: number): string[] {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(randomString());
  }
  return arr;
}

function randomTimeout(): number {
  // Random timeout between 0 seconds and 2 seconds
  const minTime = 0;
  const maxTime = 2000;
  return (Math.random() * (maxTime - minTime)) + minTime;
}

test('testSIOLayer', () => {

  // Randomly choose between 10 and 20 messages
  const len = Math.floor(Math.random() * 10) + 10;
  const testKeys = randomData(len);
  const testValues = randomData(len);
  const testResponses = randomData(len);

  expect.assertions(3 * len);

  const server = new MockSIOServer();
  const serverLayer = new SIOServerNetworkLayer(server);
  const client = server.connect();
  const clientLayer = new SIOClientNetworkLayer(client);
  serverLayer.addConnectionListener((e: ConnectionEvent) => {
    const socket = e.accept();
    socket.addRequestListener((e2: RequestEvent) => {
      // Find key in testKeys
      const index = testKeys.indexOf(e2.key);
      // Expect index to be found
      expect(index).toBeGreaterThanOrEqual(0);
      expect(e2.message).toEqual(testValues[index]);
      e2.respond(testResponses[index]);
    });
  });
  const promise = new Promise<ConnectionEvent>((resolve, reject) => {
    clientLayer.addConnectionListener((e: ConnectionEvent) => {
      resolve(e);
    });
  });
  serverLayer.listen();
  server.listen();
  clientLayer.listen();
  return promise.then((e: ConnectionEvent) => {
    const socket = e.accept();
    const promises = [];
    for (let i = 0; i < len; i++) {
      promises.push(socket.request(testKeys[i], testValues[i]).then(
        (value: string) => {
          expect(value).toEqual(testResponses[i]);
          return true;
        }
      ));
    }
    return Promise.all(promises);
  });
});
