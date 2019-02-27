export type Remote<T> = (pred: (t: T) => boolean) => Promise<T>;

const remotes: Map<string, Remote<any>> = new Map<string, Remote<any>>();

interface Named {
  name: string;
}

export function setRemote<T>(cns: Named, validator: Remote<T>) {
  remotes.set(cns.name, validator);
}

export function getRemote<T>(cns: Named): Remote<T> {
  return remotes.get(cns.name) as Remote<T>;
}
