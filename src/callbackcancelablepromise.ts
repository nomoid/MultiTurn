import CancelablePromise from './multiturn/cancelablepromise';
export default class CallbackCancelablePromise<T>
    implements CancelablePromise<T>{

  public [Symbol.toStringTag]: any;
  public then: any;
  public catch: any;

  public constructor(private promise: Promise<T>,
      private callback?: () => void) {
    this.then = promise.then;
    this.catch = promise.catch;
    this[Symbol.toStringTag] = promise[Symbol.toStringTag];
  }

  public cancel() {
    if (this.callback) {
      this.callback();
    }
  }

}
