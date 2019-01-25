import * as AJV from 'ajv';
import * as path from 'path';
import 'reflect-metadata';
import * as ts from 'typescript';
import * as TJS from 'typescript-json-schema';
import { REMOTE_NAME_KEY, REMOTE_RETURN_TYPE_KEY } from './remote';

export default class RemoteValidator {

  private validators: Map<string, AJV.ValidateFunction> = new Map();
  private ajv: AJV.Ajv;

  public constructor(private getter: (key: string) => Promise<string>,
      private typePath: string) {
    this.ajv = new AJV();
  }

  public addTypeValidator(type: {name: string}, typePath?: string) {
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
    const schema = generator.getSchemaForSymbol(symbols[i]);
    const validate = this.ajv.compile(schema);
    this.validators.set(typeName, validate);
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
    let validate: AJV.ValidateFunction;
    const existingValidate = this.validators.get(remoteType);
    if (!existingValidate) {
      validate = this.addTypeValidator({name: remoteType});
    }
    else {
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
