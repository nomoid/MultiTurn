import { ConnectionEvent } from '../../network/network';
import { SyncUserEvent, SyncUser } from '../../sync/server';
import RepeatServerSyncLayer from './layer';
import RepeatSyncUser from './user';

export default class RepeatSyncUserEvent implements SyncUserEvent {

  public constructor(private layer: RepeatServerSyncLayer,
      private event: ConnectionEvent) {

  }

  public accept(): SyncUser {
    const sock = this.event.accept();
    return new RepeatSyncUser(this.layer, sock);
  }

  public reject(): void {
    this.event.reject();
  }

}
