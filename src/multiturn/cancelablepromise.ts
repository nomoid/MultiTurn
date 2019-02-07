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
