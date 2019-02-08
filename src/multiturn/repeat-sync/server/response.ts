import CancelablePromise from '../../cancelablepromise';
import { SyncResponse } from '../../sync/server';

export default class RepeatSyncResponse implements SyncResponse {

  public constructor(public updates: Map<string, CancelablePromise<void>>,
      public result?: CancelablePromise<string>) {

  }

  // Cancel result and all updates
  public cancel(): void {
    if (this.result) {
      this.result.cancel();
    }
    for (const update of this.updates.values()) {
      update.cancel();
    }
  }

}
