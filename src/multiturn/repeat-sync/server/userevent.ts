import { ConnectionEvent, Socket } from '../../network/network';
import RefreshSocket, { RefreshEvent } from '../../network/refresh';
import { SyncUserEvent, SyncUser } from '../../sync/server';
import RepeatServerSyncLayer from './layer';
import RepeatSyncUser from './user';

function isRefreshSocket(socket: Socket): socket is RefreshSocket {
  if ((socket as RefreshSocket).addRefreshListener) {
    return true;
  }
  return false;
}

export default class RepeatSyncUserEvent implements SyncUserEvent {

  public constructor(private layer: RepeatServerSyncLayer,
      private event: ConnectionEvent) {

  }

  public accept(): SyncUser {
    const sock = this.event.accept();
    const user = new RepeatSyncUser(this.layer, sock);
    if (isRefreshSocket(sock)) {
      sock.addRefreshListener((e: RefreshEvent) => {
        user.update(true);
      });
    }
    return user;
  }

  public reject(): void {
    this.event.reject();
  }

}
