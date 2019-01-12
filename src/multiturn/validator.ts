export interface ValidationLayer<T> {
  parse(s: string): T | undefined;
}

export class EmptyValidator<T> implements ValidationLayer<T>{
  public parse(s: string): T | undefined {
    return JSON.parse(s) as T;
  }
}
