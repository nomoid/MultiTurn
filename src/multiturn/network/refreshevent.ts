import CancelablePromise from '../helper/cancelablepromise';
import { RefreshEvent } from './refresh';

export default class AbstractRefreshEvent implements RefreshEvent {

  public constructor(private requester: (key: string, message: string)
    => CancelablePromise<string>) {

  }

  public request(key: string, message: string): CancelablePromise<string> {
    return this.requester(key, message);
  }

}
