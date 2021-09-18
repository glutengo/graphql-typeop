import 'reflect-metadata';
import { Newable } from '../util/class.util';
import { FieldMetadata, fieldMetadataKey, FieldOptions, ObjectTypeMetadata } from '../util/reflection.util';

/**
 * Field decorator for fields in GraphQL type definitions (selection set)
 *
 * @param typeOrOptions the type or options to use for the field.
 * If a function which represents a class is passed, this function is used as the type of the field.
 * If an object is passed, this is interpreted as the options for the field and {@param options} is ignored as a consequence
 * @param options the options to use for the field. Ignored when {@param typeOrOptions} is of type object
 * @returns the field decorator
 */
export function Field<Parent = any, OwnArgs = any, QueryVars = OwnArgs>(typeOrOptions?: Newable<any> | FieldOptions<Parent, OwnArgs, QueryVars>, options?: FieldOptions<Parent, OwnArgs, QueryVars>): PropertyDecorator {
  return(target, key) => {
    // first parameter can either be the type or the options
    let t: Newable<any>;
    if (typeof typeOrOptions === 'function') {
      t = typeOrOptions;
    } else if (typeof typeOrOptions === 'object') {
      options = typeOrOptions;
    }
    // if no type is passed, use TypeScript metadata. Note: this does not work for array types
    if (!t) {
      t =  Reflect.getMetadata('design:type', target, key);
    }
    options = {...options};
    if (t) {
      const existingFields = (Reflect.getMetadata(fieldMetadataKey, target) as ObjectTypeMetadata<Parent>) ?? new Map<string, FieldMetadata<Parent>>();
      const fields = new Map(existingFields);
      fields.set(key as string, { type: t, options});
      Reflect.defineMetadata(fieldMetadataKey, fields, target);
    }
  }
}

