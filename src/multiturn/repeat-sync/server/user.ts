import CancelablePromise from '../../cancelablepromise';
import { Socket } from '../../network/network';
import { SyncUser, SyncResponse } from '../../sync/server';
import { generateUID } from '../../uid';
import RepeatServerSyncLayer from './layer';

const requestId = '_syncRequest';
const updateId = '_syncUpdate';

export default class RepeatSyncUser implements SyncUser {
  public readonly id: string;

  public constructor(private layer: RepeatServerSyncLayer,
      private sock: Socket) {
    this.id = generateUID();
    layer.addUser(this);
  }

  public request(key: string, value: string, timeout?: number): SyncResponse {
    // TODO
    throw new Error('TODO');
  }

  public close(): void {
    this.sock.close();
  }

  public update(): CancelablePromise<void> {
    // TODO
    throw new Error('TODO');
  }

}
