import CancelablePromise from '../helper/cancelablepromise';
import { Socket } from './network';

export default interface RefreshSocket extends Socket {
  addRefreshListener(callback: (e: RefreshEvent) => void): void;
}

export interface RefreshEvent {
  request(key: string, message: string): CancelablePromise<string>;
}
