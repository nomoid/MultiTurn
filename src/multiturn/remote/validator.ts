import * as AJV from 'ajv';
import * as path from 'path';
import 'reflect-metadata';
import * as ts from 'typescript';
import * as TJS from 'typescript-json-schema';
import { REMOTE_NAME_KEY, REMOTE_RETURN_TYPE_KEY } from './remote';

const verbose = true;

// Validators are cached globally, beware of name conflicts
const validators: Map<string, AJV.ValidateFunction> = new Map();

export default class RemoteValidator {

  private ajv: AJV.Ajv;

  public constructor(private getter: (key: string) => Promise<string>,
      private typePath: string) {
    this.ajv = new AJV();
  }

  public addTypeValidator(type: {name: string}, typePath?: string) {
    if (verbose) {
      console.log(`[Valid] Adding type validator for type ${type.name}`);
    }
    if (typePath) {
      this.typePath = typePath;
    }
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
    if (verbose) {
      console.log('[Valid] Compiling program');
    }
    const program = ts.createProgram([path.resolve(this.typePath)],
      compilerOptions);
    const generator = TJS.buildGenerator(program, settings);
    if (!generator) {
      throw Error(`Invalid type path: ${this.typePath}`);
    }
    const symbols = generator.getUserSymbols();
    const i = symbols.indexOf(typeName);
    if (i < 0) {
      throw Error(`Type '${typeName}' not found in file '${this.typePath}'`);
    }
    if (verbose) {
      console.log('[Valid] Creating JSON schema');
    }
    const schema = generator.getSchemaForSymbol(symbols[i]);
    if (verbose) {
      console.log('[Valid] Compiling JSON schema');
    }
    const validate = this.ajv.compile(schema);
    validators.set(typeName, validate);
    if (verbose) {
      console.log(`[Valid] Type validator added for type ${type.name}`);
    }
    return validate;
  }

  public call<T>(t: (() => T)): () => Promise<T> {
    return this.internalCall(t);
  }

  public flatCall<T>(t: (() => Promise<T>)): () => Promise<T> {
    return this.internalCall(t);
  }

  private internalCall<T>(t: any): () => Promise<T> {
    const remoteName: string = Reflect.getMetadata(REMOTE_NAME_KEY, t);
    if (!remoteName) {
      throw Error('Cannot wrap function with no @remote decorator!');
    }
    const remoteType: string = Reflect.getMetadata(REMOTE_RETURN_TYPE_KEY, t);
    if (!remoteType) {
      throw Error('Cannot wrap function with no @remote decorator!');
    }
    if (verbose) {
      console.log(`[Valid] Adding call for ${remoteName} with type ${remoteType}`);
    }
    let validate: AJV.ValidateFunction;
    const existingValidate = validators.get(remoteType);
    if (!existingValidate) {
      if (verbose) {
        console.log(`[Valid] No existing validator found for type ${remoteType}`);
      }
      validate = this.addTypeValidator({name: remoteType});
    }
    else {
      if (verbose) {
        console.log(`[Valid] Existing validator found for type ${remoteType}`);
      }
      validate = existingValidate;
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

// Replace all functions in object with "remote" versions of the function
// All functions, however, now return promises rather than their original types
// Therefore, to keep the type declaration consistent, all remote functions
// of T should return promises
export function setupRemote<T>(t: T, validator: RemoteValidator): T {
  const props = Object.getOwnPropertyNames(Object.getPrototypeOf(t));
  for (const propName of props) {
    const prop = (t as any)[propName];
    if (typeof prop === 'function') {
      // Check if function has @remote tag, if so, convert to remote version
      const remoteName: string = Reflect.getMetadata(REMOTE_NAME_KEY, prop);
      if (!remoteName) {
        continue;
      }
      (t as any)[propName] = validator.flatCall(prop);
    }
  }
  return t;
}
