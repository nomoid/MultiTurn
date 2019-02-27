import CancelablePromise, { cancelable } from './cancelablepromise';

export default class PromiseHolder<T> {

  public readonly promise: CancelablePromise<T>;
  public resolve: (t: T) => void;
  public reject: (reason?: string) => void;

  // Helper to make sure that calling resolve/reject before promise is
  // created does not cause problems
  private resolvedOrRejected: boolean = false;
  private resolved: boolean = false;
  private value: T | undefined = undefined;
  private reason: any | undefined = undefined;
  private promiseHolderUpdated: boolean = false;

  public constructor(private callback?:
      (resolve: (t: T) => void, reject: () => void) => void) {
    this.resolve = (t: T) => {
      if (this.promiseHolderUpdated) {
        this.resolve(t);
      }
      else if (!this.resolvedOrRejected) {
        this.resolvedOrRejected = true;
        this.resolved = true;
        this.value = t;
      }
    };
    this.reject = (reason?: any) => {
      if (this.promiseHolderUpdated) {
        this.reject(reason);
      }
      else if (!this.resolvedOrRejected) {
        this.resolvedOrRejected = true;
        this.resolved = false;
      }
    };
    const promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.promiseHolderUpdated = true;
      if (this.resolvedOrRejected) {
        if (this.resolved) {
          this.resolve(this.value!);
        }
        else {
          this.reject(this.reason);
        }
      }
      if (this.callback) {
        this.callback(resolve, reject);
      }
    });
    this.promise = cancelable(promise, this.reject.bind(this));
  }
}
