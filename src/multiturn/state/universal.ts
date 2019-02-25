import { StateManager, SyncUserEvent } from '../sync/server';
export default class UniversalStateManager implements StateManager {

  private listeners: Array<(e: SyncUserEvent) => void> = [];

  public constructor(private state: string) {

  }

  public onNewUser(e: SyncUserEvent): void {
    for (const listener of this.listeners) {
      listener(e);
    }
  }

  public getState(id: string): string {
    return this.state;
  }

  public addUserListener(listener: (e: SyncUserEvent) => void) {
    this.listeners.push(listener);
  }

  public setState(state: string): void {
    this.state = state;
  }

}
