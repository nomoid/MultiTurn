import * as AJV from 'ajv';
import * as path from 'path';
import 'reflect-metadata';
import * as ts from 'typescript';
import * as TJS from 'typescript-json-schema';

const REMOTE_NAME_KEY = 'remoteName';
const REMOTE_RETURN_TYPE_KEY = 'remoteReturnType';

export function remote() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(REMOTE_NAME_KEY, `${target.constructor.name}.${propertyKey}`, target[propertyKey]);
    const returnType = Reflect.getMetadata('design:returntype', target, propertyKey);
    Reflect.defineMetadata(REMOTE_RETURN_TYPE_KEY, returnType.name, target[propertyKey]);
  };
}

export default class Remote {

  private validators: Map<string, AJV.ValidateFunction> = new Map();

  public constructor(private getter: (key: string) => Promise<string>) {

  }

  public addTypeValidator(type: {name: string}, typePath: string) {
    const typeName = type.name;
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
    const program = ts.createProgram([path.resolve(typePath)], compilerOptions);
    const generator = TJS.buildGenerator(program, settings);
    if (!generator) {
      throw Error(`Invalid type path: ${typePath}`);
    }
    const symbols = generator.getMainFileSymbols(program);
    /*
    if (symbols.length <= 0) {
      throw Error(`No symbols found in: ${typePath}`);
    }
    else if (symbols.length > 1) {
      throw Error(`Multiple symbols found in: ${typePath}`);
    }
    */
    const i = symbols.indexOf(typeName);
    if (i < 0) {
      throw Error(`Type '${typeName}' not found in file '${typePath}'`);
    }
    const schema = generator.getSchemaForSymbol(symbols[i]);
    const ajv = new AJV();
    const validate = ajv.compile(schema);
    this.validators.set(typeName, validate);
  }

  public call<T>(t: (() => T)): () => Promise<T> {
    const remoteName: string = Reflect.getMetadata(REMOTE_NAME_KEY, t);
    if (!remoteName) {
      throw Error('Cannot wrap function with no @remote decorator!');
    }
    const remoteType: string = Reflect.getMetadata(REMOTE_RETURN_TYPE_KEY, t);
    if (!remoteType) {
      throw Error('Cannot wrap function with no @remote decorator!');
    }
    const validate = this.validators.get(remoteType);
    if (!validate) {
      throw Error(`No validator found for type '${remoteType}'`);
    }
    return () => {
      return this.getter(remoteName).then((s: string) => {
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
}
