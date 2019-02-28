import { randomData } from '../helper/jest-helper';
import { ConnectionEvent, RequestEvent, NetworkLayer } from '../network/network';
import SIOClientNetworkLayer from './client/layer';
import MockSIOServer from './mock/server';
import SIOServerNetworkLayer from './server/layer';
import { SIOSocket, SIOServer } from './sio-external';

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

const verbose = false;

export function testNetworkLayer(serverGenerator: (s: SIOServer) => NetworkLayer,
    clientGenerator: (s: SIOSocket) => NetworkLayer) {

  // Randomly choose between 10 and 20 messages
  const len = Math.floor(Math.random() * 10) + 10;
  const testKeys = randomData(len);
  const testValues = randomData(len);
  const testResponses = randomData(len);

  expect.assertions(3 * len);

  if (verbose) {
    console.log(testKeys);
    console.log(testValues);
    console.log(testResponses);
  }

  const server = new MockSIOServer();
  const serverLayer = serverGenerator(server);
  const client = server.connect();
  const clientLayer = clientGenerator(client);
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
    const request = (i: number) => {
      return (value: string) => {
        if (verbose) {
          console.log(i);
        }
        expect(value).toEqual(testResponses[i]);
        return true;
      };
    };
    for (let i = 0; i < len; i++) {
      promises.push(socket.request(testKeys[i], testValues[i]).then(
        request(i)
      ));
    }
    return Promise.all(promises);
  });
}

test('testSIOLayer', () => {
  return testNetworkLayer((server: SIOServer) => {
    return new SIOServerNetworkLayer(server);
  }, (client: SIOSocket) => {
    return new SIOClientNetworkLayer(client);
  });
});
