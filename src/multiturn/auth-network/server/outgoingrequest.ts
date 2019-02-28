import { CancelToken } from '../../helper/cancelablepromise';
import PromiseHolder from '../../helper/promiseholder';
import { generateUID } from '../../helper/uid';

export default class OutgoingRequest {

  public readonly uid: string;
  public readonly promiseHolder: PromiseHolder<string>;

  public constructor(readonly key: string, readonly message: string,
    readonly orderId: number,
    cancelCallback: () => void) {
    this.uid = generateUID();
    this.promiseHolder = new PromiseHolder<string>(undefined);
    this.promiseHolder.promise.catch((reason) => {
      if (reason === CancelToken) {
        cancelCallback();
      }
    });
  }
}
