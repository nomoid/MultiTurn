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
  update(): Promise<void>;
  getUser(id: IdType): SyncUser;
  getUsers(): SyncUser[];
}

export interface SyncUserEvent {
  accept(): SyncUser;
  reject(): void;
}

export interface SyncUser {
  readonly id: IdType;
  // On request, send a state update to all players
  request(key: string, value: string, timeout?: number): Map<IdType, SyncRequest>;
  close(): void;
}

export interface SyncStateEvent {
  readonly id: IdType;
  readonly key: string;
  readonly message: string;
}

export interface SyncRequest {
  readonly result: Promise<string>;

  cancel(): void;
}

export interface StateManager {
  getState(id: IdType): string;
}
