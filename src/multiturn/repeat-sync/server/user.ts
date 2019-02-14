import CancelablePromise, { cancelableThen } from '../../cancelablepromise';
import { Socket } from '../../network/network';
import { ClientSyncCombinedEvent } from '../../sync/client';
import { SyncUser, SyncResponse } from '../../sync/server';
import { generateUID } from '../../uid';
import RepeatServerSyncLayer from './layer';
import RepeatSyncResponse from './response';

const requestId = '_syncRequest';
const updateId = '_syncUpdate';

export default class RepeatSyncUser implements SyncUser {
  public readonly id: string;

  public constructor(private layer: RepeatServerSyncLayer,
      private sock: Socket) {
    this.id = generateUID();
    layer.addUser(this);
  }

  // TODO retry on failure, consistency ensuring
  public request(key: string, message: string, timeout?: number): SyncResponse {
    // Send out an update to everyone else
    const response = this.layer.update(this.id);
    // Send a combined update & request to the recipient
    const state = this.layer.state.getState(this.id);
    const requestObject: ClientSyncCombinedEvent = {
      key, message, state
    };
    const requestString = JSON.stringify(requestObject);
    const result = this.sock.request(requestId, requestString);
    const newResponse = new RepeatSyncResponse(response.updates, result);
    return newResponse;
  }

  public close(): void {
    this.sock.close();
  }

  // TODO retry on failure, consistency ensuring
  public update(): CancelablePromise<void> {
    const state = this.layer.state.getState(this.id);
    return cancelableThen(this.sock.request(updateId, state),
      (res) => {
        return;
      });
  }

}
