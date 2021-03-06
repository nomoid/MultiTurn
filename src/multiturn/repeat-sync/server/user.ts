import * as logger from 'loglevel';
import CancelablePromise, { cancelableThen } from '../../helper/cancelablepromise';
import { cancelableResolve } from '../../helper/cancelablepromise';
import { generateUID } from '../../helper/uid';
import { Socket } from '../../network/network';
import { ClientSyncCombinedEvent } from '../../sync/client';
import { SyncUser, SyncResponse } from '../../sync/server';
import RepeatServerSyncLayer from './layer';
import RepeatSyncResponse from './response';

const log = logger.getLogger('Sync');

const requestId = '_syncRequest';
const updateId = '_syncUpdate';

export default class RepeatSyncUser implements SyncUser {
  public readonly id: string;

  // Keep track of last update state so that update is only sent when it
  // changes
  private lastUpdateState?: string;

  public constructor(private layer: RepeatServerSyncLayer,
      private sock: Socket) {
    this.id = generateUID();
    layer.addUser(this);
  }

  public requestSingle(key: string, message: string,
      timeout?: number, preState?: string): CancelablePromise<string> {
    let state: string;
    if (preState) {
      state = preState;
    }
    else {
      state = this.layer.state.getState(this.id);
    }
    log.debug(`Sending out single request: ${key},${message},${state}`);
    const requestObject: ClientSyncCombinedEvent = {
      key, message, state
    };
    const requestString = JSON.stringify(requestObject);
    const result = this.sock.request(requestId, requestString);
    return result;
  }

  // TODO retry on failure, consistency ensuring
  public request(key: string, message: string, timeout?: number): SyncResponse {
    log.debug('Sending out mass request');
    // Send out an update to everyone else
    const response = this.layer.update(this.id);
    // Send a combined update & request to the recipient
    const state = this.layer.state.getState(this.id);
    const result = this.requestSingle(key, message, timeout, state);
    const newResponse = new RepeatSyncResponse(response.updates, result);
    return newResponse;
  }

  public close(): void {
    this.sock.close();
  }

  // TODO retry on failure, consistency ensuring
  public update(force?: boolean): CancelablePromise<void> {
    const state = this.layer.state.getState(this.id);
    if (!force && this.lastUpdateState && this.lastUpdateState === state) {
      log.debug('Avoided sending duplicate state');
      // State hasn't changed, avoid sending
      return cancelableResolve();
    }
    else {
      log.debug(`Update state: ${state}`);
      this.lastUpdateState = state;
      return cancelableThen(this.sock.request(updateId, state),
        (res) => {
          return;
        });
      }
  }

}
