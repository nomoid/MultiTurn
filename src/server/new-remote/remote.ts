export const REMOTE_NAME_KEY = 'remoteName';
export const REMOTE_RETURN_TYPE_KEY = 'remoteReturnType';
import 'reflect-metadata';

export function remote(namedType?: {name: string}) {
  return (target: any, propertyKey: string,
      descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(REMOTE_NAME_KEY,
      `${target.constructor.name}.${propertyKey}`, target[propertyKey]);
    let returnType;
    if (namedType) {
      returnType = namedType;
    }
    else {
      returnType = Reflect.getMetadata('design:returntype', target,
        propertyKey);
    }
    Reflect.defineMetadata(REMOTE_RETURN_TYPE_KEY, returnType.name,
      target[propertyKey]);
  };
}
