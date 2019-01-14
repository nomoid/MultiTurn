import PromiseHolder from '../promiseholder';
import { generateUID } from './uid';

export default class OutgoingRequest {

  public readonly uid: string;
  public readonly promiseHolder: PromiseHolder<string>;

  public constructor(public key: string, public message: string) {
    this.uid = generateUID();
    this.promiseHolder = new PromiseHolder<string>();
  }
}
