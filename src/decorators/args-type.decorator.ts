import 'reflect-metadata';
import { argsTypeMetadataKey } from '../util/reflection.util';

/**
 * Mark a class as describing the Argument Types of a GraphQL operation
 *
 * @param name The optional name of the ArgsType
 * @constructor
 */
export function ArgsType(name?: string): ClassDecorator {
  return (target) => {
    if (name) {
      Reflect.defineMetadata(argsTypeMetadataKey, name, target);
    }
  }
}
