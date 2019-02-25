import { StateManager, SyncUserEvent, SyncUser } from '../sync/server';
export default class IndividualStateManager implements StateManager {

  private users: Map<string, string> = new Map();
  private listeners: Array<(e: SyncUser) => void> = [];

  public constructor(private defaultState: string) {

  }

  public onNewUser(e: SyncUserEvent): void {
    const user = e.accept();
    this.users.set(user.id, this.defaultState);
    for (const listener of this.listeners) {
      listener(user);
    }
  }

  public getState(id: string): string {
    const userState = this.users.get(id);
    if (userState) {
      return userState;
    }
    else {
      // throw exception
      throw new Error(`User with id ${id} not found`);
    }
  }

  public addUserListener(listener: (e: SyncUser) => void) {
    this.listeners.push(listener);
  }

  public setUserState(id: string, state: string): void {
    if (this.users.has(id)) {
      this.users.set(id, state);
    }
    else {
      // throw exception
      throw new Error(`User with id ${id} not found`);
    }
  }

}
