export default interface CancelablePromise<T> extends Promise<T> {
  cancel(): void;
}
