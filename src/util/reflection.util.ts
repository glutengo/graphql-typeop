import 'reflect-metadata';
import { ArgumentValue } from './ast.util';
import { Newable } from './class.util';

export const fieldMetadataKey = Symbol('fields');
export const argsMetadataKey = Symbol('args');

/**
 * Metadata stored for a field
 *
 */
export type FieldMetadata<T, FieldArgs = any, QueryVars = any> = {
  type: Newable<any>,
  options: FieldOptions<T, FieldArgs, QueryVars>
}

/**
 * Available options for field definition
 */
export type FieldOptions<Parent = any, FieldArgs = any, QueryVars = any> = {
  /**
   * Field alias. Should be used to map a field which is not part of the GraphQL schema to a field which is part of the schema
   */
  aliasFor?: keyof Parent & string;
  /**
   * Whether to skip the field. If specified, a @skip() directive will be included in the query. The property value is used as the value of the if argument of the directive.
   */
  skip?: ArgumentValue<QueryVars>;

  /**
   * Map between field arguments and query variables or actual values
   */
  args?: {[key in keyof FieldArgs]: ArgumentValue<QueryVars>}
}

/**
 * Metadata stored for an ObjectType class
 */
export type ObjectTypeMetadata<T> = Map<string, FieldMetadata<T>>;

/**
 * Metadata stored for an argument
 */
export type ArgMetadata = {
  type: Newable<any>,
  options: ArgOptions
};

/**
 * Metadata stored for an ArgsType class
 */
export type ArgObjectMetadata = Map<string, ArgMetadata>;

/**
 * Available option for argument definition
 */
export type ArgOptions = {
  nullable?: boolean;
}

export function getFieldMetadata<T>(t: Newable<T>): ObjectTypeMetadata<T> {
  return Reflect.getMetadata(fieldMetadataKey, new t()) ?? new Map<String, FieldMetadata<T>>();
}


export function getArgsMetadata(target): ArgObjectMetadata {
  return Reflect.getMetadata(argsMetadataKey, target) ?? new Map<String, ArgMetadata>();
}
