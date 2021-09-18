import 'reflect-metadata';
import { ArgMetadata, ArgObjectMetadata, ArgOptions, argsMetadataKey } from '../util/reflection.util';
import { Newable } from '../util/class.util';

/**
 * Arg decorator for fields in GraphQL type definitions (args type)
 *
 * @param typeOrOptions the type or options to use for the field.
 * If a function which represents a class is passed, this function is used as the type of the field.
 * If an object is passed, this is interpreted as the options for the field and {@param options} is ignored as a consequence
 * @param options the options to use for the field. Ignored when {@param typeOrOptions} is of type object
 * @returns the field decorator
 */
export function Arg(typeOrOptions?: Newable<any> | ArgOptions, options?: ArgOptions) {
  return (target, key) => {
    // first parameter can either be the type or the options
    let t: Newable<any>;
    if (typeof typeOrOptions === 'function') {
      t = typeOrOptions;
    } else if (typeof typeOrOptions === 'object') {
      options = typeOrOptions;
    }
    // if no type is passed, use TypeScript metadata. Note: this does not work for array types
    if (!t) {
      t = Reflect.getMetadata('design:type', target, key);
    }
    if (t) {
      const existingArgs = (Reflect.getMetadata(argsMetadataKey, target) as ArgObjectMetadata) ?? new Map<string, ArgMetadata>();
      const args = new Map(existingArgs);
      args.set(key as string, { type: t, options });
      Reflect.defineMetadata(argsMetadataKey, args, target);
    }
  }
}




