import { Socket } from '../network';

export default interface ARSocket extends Socket {
  accept(): void;
  reject(): void;
}
