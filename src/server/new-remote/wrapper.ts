import * as AJV from 'ajv';
import * as path from 'path';
import 'reflect-metadata';
import * as ts from 'typescript';
import * as TJS from 'typescript-json-schema';
import Move from '../move';

const REMOTE_NAME_KEY = 'remoteName';

export function remote() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(REMOTE_NAME_KEY, `${target.constructor.name}.${propertyKey}`, target[propertyKey]);
  };
}

function getFromRemote(key: string): Promise<string> {
  console.log(key);
  return Promise.resolve(JSON.stringify(new Move(1, 1)));
}

export default function remoteCall<T>(t: (() => T), typePath: string): () => Promise<T> {
  const compilerOptions: TJS.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    strict: true,
  };
  const settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true
  };
  const remoteName: string = Reflect.getMetadata(REMOTE_NAME_KEY, t);
  if (!remoteName) {
    throw Error('Cannot wrap function with no @remote decorator!');
  }
  const program = ts.createProgram([path.resolve(typePath)], compilerOptions);
  const generator = TJS.buildGenerator(program);
  if (!generator) {
    throw Error(`Invalid type path: ${typePath}`);
  }
  const symbols = generator.getMainFileSymbols(program);
  if (symbols.length <= 0) {
    throw Error(`No symbols found in: ${typePath}`);
  }
  else if (symbols.length > 1) {
    throw Error(`Multiple symbols found in: ${typePath}`);
  }
  const schema = generator.getSchemaForSymbol(symbols[0]);
  const ajv = new AJV();
  const validate = ajv.compile(schema);
  return () => {
    return getFromRemote(remoteName).then((s: string) => {
      return new Promise<T>((resolve, reject) => {
        const obj = JSON.parse(s);
        if (!validate(obj)) {
          reject(validate.errors);
        }
        else {
          resolve(obj as T);
        }
      });
    });
  };
}
