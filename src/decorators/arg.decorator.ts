import 'reflect-metadata';
import { AstVariableOptions } from '../util/ast.util';
import { getScalarType, Newable } from '../util/class.util';

const metadataKey = Symbol('args');

/**
 * Metadata stored for an argument
 */
type ArgMetadata = {
  type: Newable<any>,
  options: ArgOptions
};

/**
 * Available option for argument definition
 */
export type ArgOptions = {
  nullable?: boolean;
}

type ArgObjectMetadata = Map<string, ArgMetadata>;

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
      const args = (Reflect.getMetadata(metadataKey, target) as ArgObjectMetadata) ?? new Map<string, ArgMetadata>();
      args.set(key as string, { type: t, options });
      Reflect.defineMetadata(metadataKey, args, target);
    }
  }
}

function getArgsMetadata(target): ArgObjectMetadata {
  return Reflect.getMetadata(metadataKey, target) ?? new Map<String, ArgMetadata>();
}

export function getVariableOptions<A>(a: Newable<A>): AstVariableOptions[] {
  const args = getArgsMetadata(new a());
  return args ? Array.from(args.keys()).map(k => {
    const v = args.get(k);
    return {
      name: k,
      type: getScalarType(v.type),
      nullable: v.options.nullable
    }
  }) : [];
}



