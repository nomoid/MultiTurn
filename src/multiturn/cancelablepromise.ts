import PromiseHolder from './promiseholder';
export const CancelToken = Symbol();

export default interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

export function cancelable<T>(oldPromise: Promise<T>,
    reject: (reason?: any) => void): CancelablePromise<T> {
  const promise: Partial<CancelablePromise<T>> = oldPromise;
  promise.cancel = () => {
    reject(CancelToken);
  };
  return promise as CancelablePromise<T>;
}

export function cancelablePromise<T>(callback?:
    (resolve: (t: T) => void, reject: () => void) => void) {
  const holder = new PromiseHolder<T>(callback);
  return holder.promise;
}

export function cancelableThen<T, S>(oldPromise: CancelablePromise<T>,
    continuation: (res: T) => S): CancelablePromise<S> {
  return cancelable(oldPromise.then(continuation),
    oldPromise.cancel.bind(oldPromise));
}
