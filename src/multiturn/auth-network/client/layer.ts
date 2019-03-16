import * as logger from 'loglevel';
import AbstractConnectionEvent from '../../network/connectionevent';
import { NetworkLayer, ConnectionEvent, Socket, RequestEvent } from '../../network/network';
import { Serializer, Deserializer, defaultSerializer, defaultDeserializer } from '../../sio-network/serializer';
import AuthClientSocket from './socket';
import TokenHandler from './token';

const log = logger.getLogger('Auth');

const registerId = '_register';
const loginId = '_login';
const refreshId = '_refresh';
const loginSuccessId = '_login_success';
const loginFailId = '_login_fail';
const refreshSuccessId = '_refresh_success';
const refreshFailId = '_refresh_fail';

export default class AuthClientNetworkLayer implements NetworkLayer {

  private listeners: Array<(e: ConnectionEvent) => void>;
  private listening: boolean = false;
  private serializer: Serializer;
  private deserializer: Deserializer;
  private tokenHandler?: TokenHandler;

  public constructor(private network: NetworkLayer, public token?: string,
    // Timeout in milliseconds between refreshes, 0 for no repeat
    private repeatDelay?: number,
    serializer?: Serializer, deserializer?: Deserializer) {
    this.listeners = [];
    if (serializer) {
      this.serializer = serializer;
    }
    else {
      this.serializer = defaultSerializer('*');
    }
    if (deserializer) {
      this.deserializer = deserializer;
    }
    else {
      this.deserializer = defaultDeserializer('*');
    }
  }

  public setTokenHandler(handler: TokenHandler) {
    this.tokenHandler = handler;
    this.token = handler.getLocalToken();
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.network.addConnectionListener((e: ConnectionEvent) => {
      const socket = e.accept();
      // Negotiate connection by login/register
      if (this.token) {
        this.tryLogin(socket, this.token);
      }
      else {
        this.tryRegister(socket);
      }
    });
    this.network.listen();
  }

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

  public async refresh(socket: Socket, token: string) {
    let failures = 0;
    while (true) {
      log.debug('Initiating refresh');
      const response = await socket.request(refreshId, token);
      if (response === refreshSuccessId) {
        failures = 0;
        if (this.repeatDelay && this.repeatDelay > 0) {
          log.debug('Refresh success, waiting');
          await new Promise((resolve, reject) => {
            setTimeout(resolve, this.repeatDelay);
          });
        }
        else {
          log.debug('Refresh success!');
          break;
        }
      }
      else if (response === refreshFailId) {
        failures += 1;
        if (failures > 3) {
          log.debug('Refresh failed!');
          break;
        }
        log.debug('Refresh failed, trying again');
        continue;
      }
      else {
        log.warn(`Invalid server response: ${response}`);
        break;
      }
    }
  }

  private tryLogin(socket: Socket, token: string) {
    log.info(`Trying to login with token ${token}`);
    socket.request(loginId, token).then((response: string) => {
      if (response === loginSuccessId) {
        this.authSuccess(socket, token);
      }
      else if (response === loginFailId) {
        this.tryRegister(socket);
      }
      else {
        log.warn(`Invalid server response: ${response}`);
      }
     });
  }

  private tryRegister(socket: Socket) {
    log.info('Trying to register');
    socket.request(registerId, '').then((response: string) => {
      this.token = response;
      const handler = this.tokenHandler;
      if (handler) {
        handler.setLocalToken(response);
      }
      this.authSuccess(socket, this.token);
    });
  }

  private authSuccess(socket: Socket, token: string) {
    log.info(`Authentication success with token ${token}`);
    for (const listener of this.listeners) {
      const authSock = new AuthClientSocket(socket, token,
        this.serializer, this.deserializer);
      listener(new AbstractConnectionEvent(authSock));
    }
    this.refresh(socket, token);
  }
}
