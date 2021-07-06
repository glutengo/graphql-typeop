import 'reflect-metadata';
import { ArgMetadata, ArgObjectMetadata, ArgOptions, argsMetadataKey } from '../util/reflection.util';
import { Newable } from '../util/class.util';


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
      const args = (Reflect.getMetadata(argsMetadataKey, target) as ArgObjectMetadata) ?? new Map<string, ArgMetadata>();
      args.set(key as string, { type: t, options });
      Reflect.defineMetadata(argsMetadataKey, args, target);
    }
  }
}




