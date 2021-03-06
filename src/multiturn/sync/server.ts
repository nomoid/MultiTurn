import CancelablePromise from '../helper/cancelablepromise';

/**
 * The synchronization layer handles synchronizing the client state to the
 * server state, ensuring that all parties are working with the most up to
 * date information possible, and that requests are not lost and are processed
 * in order.
 */

type IdType = string;
type StateType = string;

export interface ServerSyncLayer {

  state: StateManager;

  listen(): void;

  // Send state update to all players without a request
  update(): SyncResponse;
  getUser(id: IdType): SyncUser | undefined;
  getUsers(): SyncUser[];
  requestAll(key: string, value: string): SyncResponse;
}

export interface SyncUserEvent {
  accept(): SyncUser;
  reject(): void;
}

export interface SyncUser {
  readonly id: IdType;
  // On request, send a state update to all players
  request(key: string, value: string, timeout?: number): SyncResponse;
  close(): void;
}

export interface SyncStateEvent {
  readonly id: IdType;
  readonly key: string;
  readonly message: string;
}

export interface SyncResponse {
  readonly result?: CancelablePromise<string>;
  readonly updates: Map<IdType, CancelablePromise<void>>;
  cancel(): void;
}

export interface StateManager {
  onNewUser(e: SyncUserEvent): void;
  getState(id: IdType): StateType;
}
