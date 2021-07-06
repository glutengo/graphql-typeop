import 'reflect-metadata';
import { argsTypeMetadataKey } from '../util/reflection.util';

export function ArgsType(name?: string): ClassDecorator {
  return (target) => {
    if (name) {
      Reflect.defineMetadata(argsTypeMetadataKey, name, target);
    }
  }
}
