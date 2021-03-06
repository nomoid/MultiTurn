import CancelablePromise, { cancelableThen } from '../../helper/cancelablepromise';
import { NetworkLayer, ConnectionEvent } from '../../network/network';
import { ServerSyncLayer, SyncResponse, StateManager, SyncUser } from '../../sync/server';
import RepeatSyncResponse from './response';
import RepeatSyncUser from './user';
import RepeatSyncUserEvent from './userevent';

export default class RepeatServerSyncLayer implements ServerSyncLayer {
  private userMap: Map<string, RepeatSyncUser>;
  private users: RepeatSyncUser[];
  private listening: boolean = false;

  public constructor(private network: NetworkLayer,
      public state: StateManager) {
    this.userMap = new Map();
    this.users = [];
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.network.addConnectionListener((e: ConnectionEvent) => {
      this.state.onNewUser(new RepeatSyncUserEvent(this, e));
    });
    this.network.listen();
  }

  public requestAll(key: string, message: string): SyncResponse {
    const promises: Map<string, CancelablePromise<void>> = new Map();
    for (const user of this.userMap.values()) {
      promises.set(user.id, cancelableThen(
        user.requestSingle(key, message),
        (s) => {
          return;
        }
      ));
    }
    return new RepeatSyncResponse(promises);
  }

  public update(exclude?: string): SyncResponse {
    const promises: Map<string, CancelablePromise<void>> = new Map();
    for (const user of this.userMap.values()) {
      if (exclude && user.id === exclude) {
        continue;
      }
      promises.set(user.id, user.update());
    }
    return new RepeatSyncResponse(promises);
  }

  public getUser(id: string): SyncUser | undefined {
    return this.userMap.get(id);
  }
  public getUsers(): SyncUser[] {
    return this.users;
  }

  public addUser(user: RepeatSyncUser) {
    this.users.push(user);
    this.userMap.set(user.id, user);
  }

}
