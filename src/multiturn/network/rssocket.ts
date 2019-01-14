import { Socket } from './network';

export default interface RSSocket extends Socket {
  respond(key: string, message: string): void;
}
