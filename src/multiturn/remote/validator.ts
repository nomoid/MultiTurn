import * as AJV from 'ajv';
import * as fs from 'fs';
import * as logger from 'loglevel';
import * as path from 'path';
import 'reflect-metadata';
import * as ts from 'typescript';
import * as TJS from 'typescript-json-schema';
import { REMOTE_NAME_KEY, REMOTE_RETURN_TYPE_KEY } from './remote';

// Validators are cached globally, beware of name conflicts
const validators: Map<string, AJV.ValidateFunction> = new Map();

const log = logger.getLogger('Valid');

const typeCacheRoot = 'type_cache';

export default class RemoteValidator {

  private ajv: AJV.Ajv;

  public constructor(private getter: (key: string) => Promise<string>,
      private typePath: string, private localCache: boolean) {
    this.ajv = new AJV();
  }

  public addTypeValidator(type: {name: string}, typePath?: string) {
    log.info(`Adding type validator for type ${type.name}...`);
    if (typePath) {
      this.typePath = typePath;
    }
    const typeName = type.name;
    if (this.localCache) {
      log.debug('Searching local cache for existing schema');
      try {
        const fileName = path.join(typeCacheRoot, `${typeName}.json`);
        const file = fs.readFileSync(fileName, 'utf8');
        const fileSchema = JSON.parse(file);
        log.debug('Compiling JSON schema from local cache');
        const fileValidate = this.ajv.compile(fileSchema);
        validators.set(typeName, fileValidate);
        log.info(`Type validator added for type ${type.name} from local cache`);
        return fileValidate;
      }
      catch (e) {
        log.debug('Exception occurred while reading local cache');
      }
    }
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
    log.debug('Compiling program');
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
    log.debug('Creating JSON schema');
    const schema = generator.getSchemaForSymbol(symbols[i]);
    log.debug('Compiling JSON schema');
    const validate = this.ajv.compile(schema);
    validators.set(typeName, validate);
    log.info(`Type validator added for type ${type.name}`);
    if (this.localCache) {
      log.debug('Saving schema to local cache');
      try {
        fs.mkdirSync(typeCacheRoot);
        const fileName = path.join(typeCacheRoot, `${typeName}.json`);
        const schemaData = JSON.stringify(schema);
        fs.writeFileSync(fileName, schemaData, 'utf8');
        log.info('Schema saved to local cache');
      }
      catch (e) {
        log.debug('Exception occurred while saving schema to local cache');
      }
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
    log.debug(`Adding call for ${remoteName} with type ${remoteType}`);
    let validate: AJV.ValidateFunction;
    const existingValidate = validators.get(remoteType);
    if (!existingValidate) {
      log.debug(`No existing validator found for type ${remoteType}`);
      validate = this.addTypeValidator({name: remoteType});
    }
    else {
      log.debug(`Existing validator found for type ${remoteType}`);
      validate = existingValidate;
    }
    return async () => {
      // TODO implement timeouts
      while (true) {
        const s = await this.getter(remoteName);
        try {
          const obj = JSON.parse(s);
          if (!validate(obj)) {
            log.debug('Incoming object failed validation');
            // Retry rather than throwing an exception here
          }
          else {
            return (obj as T);
          }
        }
        catch (e) {
          log.debug('Incoming object threw an error on validation');
          // Retry rather than throwing an exception here
        }
      }
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
