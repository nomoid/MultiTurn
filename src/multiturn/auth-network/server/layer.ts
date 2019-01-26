import AbstractConnectionEvent from '../../network/connectionevent';
import { NetworkLayer, ConnectionEvent, RequestEvent,
  Socket } from '../../network/network';
import { Serializer, Deserializer,
  defaultSerializer, defaultDeserializer } from '../../sio-network/serializer';
import { generateUID } from '../../uid';
import AuthSocket from './socket';
import AuthUser from './user';

const registerId = '_register';
const loginId = '_login';
const loginSuccessId = '_login_success';
const loginFailId = '_login_fail';

export const verbose = false;

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

  private handleRequest(socket: Socket) {
    return (e: RequestEvent) => {
      if (e.key === registerId) {
        if (verbose) {
          console.log('[Auth] New registration request');
        }
        // Check if socket is already registered, if so, give them their ID
        for (const id of this.users.keys()) {
          const existingUser = this.users.get(id)!;
          if (existingUser.socket === socket) {
            if (verbose) {
              console.log(`[Auth] Socket is already registered with id ${id}`);
            }
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
        if (verbose) {
          console.log(`[Auth] Socket registered with id ${newId}`);
        }
      }
      else if (e.key === loginId) {
        // If id exists, replace sock with the given id
        const id = e.message;
        if (verbose) {
          console.log(`[Auth] New login request with id ${id}`);
        }
        if (this.users.has(id)) {
          const user = this.users.get(id)!;
          if (verbose) {
            console.log(`[Auth] User found with id ${id}`);
          }
          e.respond(loginSuccessId);
          user.socket = socket;
          // Resend all outstanding requests
          user.refresh();
        }
        else {
          if (verbose) {
            console.log(`[Auth]User not found with id ${id}`);
          }
          e.respond(loginFailId);
          // TODO deal with repeated failure to login?
        }
      }
      else if (this.users.has(e.key)) {
        const user = this.users.get(e.key)!;
        user.handleRequest(e);
      }
    };
  }

}
