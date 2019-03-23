import * as logger from 'loglevel';
import { generateUID } from '../../helper/uid';
import AbstractConnectionEvent from '../../network/connectionevent';
import { NetworkLayer, ConnectionEvent, RequestEvent,
  Socket } from '../../network/network';
import { Serializer, Deserializer,
  defaultSerializer, defaultDeserializer } from '../../sio-network/serializer';
import AuthSocket from './socket';
import AuthUser from './user';

const log = logger.getLogger('Auth');

const registerId = '_register';
const loginId = '_login';
const refreshId = '_refresh';
const loginSuccessId = '_login_success';
const loginFailId = '_login_fail';
const refreshSuccessId = '_refresh_success';
const refreshFailId = '_refresh_fail';

export const verbose = true;

export default class AuthServerNetworkLayer implements NetworkLayer {

  private users: Map<string, AuthUser>;
  private listeners: Array<(e: ConnectionEvent) => void>;
  private listening: boolean = false;
  private serializer: Serializer;
  private deserializer: Deserializer;

  // Use an underlying network layer for actual network connections
  public constructor(private network: NetworkLayer,
    serializer?: Serializer, deserializer?: Deserializer) {
    this.listeners = [];
    this.users = new Map();
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

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.network.addConnectionListener((e: ConnectionEvent) => {
      const socket = e.accept();
      socket.addRequestListener(this.handleRequest(socket).bind(this));
    });
    this.network.listen();
  }

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

  public clearConnectionListeners() {
    this.listeners = [];
  }

  public getUsers() {
    return this.users;
  }

  public register(socket: Socket, e: RequestEvent) {
    log.info('New registration request');
    // Check if socket is already registered, if so, give them their ID
    for (const id of this.users.keys()) {
      const existingUser = this.users.get(id)!;
      if (existingUser.socket === socket) {
        log.debug(`Socket is already registered with id ${id}`);
        e.respond(id);
        return;
      }
    }
    // Socket is not registered, register it
    const newId = generateUID();
    const user = new AuthUser(newId, socket, this.serializer,
      this.deserializer);
    this.users.set(newId, user);
    e.respond(newId);
    for (const listener of this.listeners) {
      const authSock = new AuthSocket(user);
      listener(new AbstractConnectionEvent(authSock));
    }
    log.info(`Socket registered with id ${newId}`);
  }

  public login(socket: Socket, e: RequestEvent) {
    // If id exists, replace sock with the given id
    const id = e.message;
    log.info(`New login request with id ${id}`);
    if (this.users.has(id)) {
      const user = this.users.get(id)!;
      log.debug(`User found with id ${id}`);
      user.socket = socket;
      e.respond(loginSuccessId);
    }
    else {
      log.debug(`User not found with id ${id}`);
      e.respond(loginFailId);
      // TODO deal with repeated failure to login?
    }
  }

  public refresh(socket: Socket, e: RequestEvent) {
    const id = e.message;
    log.info(`New refresh request with id ${id}`);
    if (this.users.has(id)) {
      const user = this.users.get(id)!;
      log.debug(`User found with id ${id}`);
      // Resend all outstanding requests
      user.refresh();
      e.respond(refreshSuccessId);
    }
    else {
      log.debug(`User not found with id ${id}`);
      e.respond(refreshFailId);
    }
  }

  public handleUserRequest(socket: Socket, e: RequestEvent) {
    const user = this.users.get(e.key)!;
    user.handleRequest(e);
  }

  private handleRequest(socket: Socket) {
    return (e: RequestEvent) => {
      if (e.key === registerId) {
        this.register(socket, e);
      }
      else if (e.key === loginId) {
        this.login(socket, e);
      }
      else if (e.key === refreshId) {
        this.refresh(socket, e);
      }
      else if (this.users.has(e.key)) {
        this.handleUserRequest(socket, e);
      }
    };
  }

}
