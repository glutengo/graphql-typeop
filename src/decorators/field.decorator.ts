import { getScalarType, isFunction, Newable } from '../util/class.util';
import 'reflect-metadata';
import * as GraphQL from 'graphql';
import { ArgumentValue, AstFieldOptions, AstVariableOptions, createQuery } from '../util/ast.util';
import { getVariableOptions } from './arg.decorator';

const metadataKey = Symbol('fields');

/**
 * Metadata stored for a field
 */
type FieldMetadata<T, OwnArgs = any, QueryArgs = any> = {
  type: Newable<any>,
  options: FieldOptions<T, OwnArgs, QueryArgs>
}

/**
 * Available options for field definition
 */
export type FieldOptions<Parent = any, OwnArgs = any, QueryArgs = any> = {
  /**
   * Field alias. Should be used to map a field which is not part of the GraphQL schema to a field which is part of the schema
   */
  aliasFor?: keyof Parent & string;
  /**
   * Whether to skip the field. If specified, a @skip() directive will be included in the query. The property value is used as the value of the if argument of the directive.
   */
  skip?: ArgumentValue<QueryArgs>;

  /**
   * Map between field arguments and query variables or actual values
   */
  // args?: {key: keyof OwnArgs, value: keyof QueryArgs}[]
  args?: {[key in keyof OwnArgs]: ArgumentValue<QueryArgs>}
}

/**
 * Metadata stored for a class
 */
type ObjectTypeMetadata<T> = Map<string, FieldMetadata<T>>;

/**
 * Field decorator for fields in GraphQL type definitions
 *
 * @param typeOrOptions the type or options to use for the field.
 * If a function which represents a class is passed, this function is used as the type of the field.
 * If an object is passed, this is interpreted as the options for the field and {@param options} is ignored as a consequence
 * @param options the options to use for the field. Ignored when {@param typeOrOptions} is of type object
 * @returns the field decorator
 */
export function Field<Parent = any, OwnArgs = any, OtherArgs = any>(typeOrOptions?: Newable<any> | FieldOptions<Parent, OwnArgs, OtherArgs>, options?: FieldOptions<Parent, OwnArgs, OtherArgs>): PropertyDecorator {
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
      const fields = (Reflect.getMetadata(metadataKey, target) as ObjectTypeMetadata<Parent>) ?? new Map<string, FieldMetadata<Parent>>();
      fields.set(key as string, { type: t, options});
      Reflect.defineMetadata(metadataKey, fields, target);
    }
  }
}

/**
 * builds a GraphQL AST document containing a query operation with the selection set specified via the fields in the given class
 *
 * @param title the name of the query to run
 * @param t the class which specifies the selection set
 * @param a the (optional) class representing the arguments of the query
 * @returns a GraphQL DocumentNode
 */
export function getFieldsDocument<T, A>(t: Newable<T>, a?: Newable<A>): GraphQL.DocumentNode {
  const fields = getFieldMetadata(t);
  const result = fields.get('result');
  return {
    kind: 'Document',
    definitions: [
      createQuery({
        selections: getFieldOptions(t),
        variables: a ? getVariableOptions(a) : undefined
      })
    ]
  }
}

function getFieldMetadata<T>(t: Newable<T>): ObjectTypeMetadata<T> {
  return Reflect.getMetadata(metadataKey, new t()) ?? new Map<String, FieldMetadata<T>>();
}

function getFieldOptions<T>(t: Newable<T>): AstFieldOptions[] {
  const fields = getFieldMetadata(t);
  return fields ? Array.from(fields.keys()).map(k => {
    const v = fields.get(k);
    return {
      name: v.options.aliasFor ?? k,
      alias: v.options.aliasFor ? k : undefined,
      selections: v?.type && isFunction(v.type) ? getFieldOptions(v.type) : undefined,
      skip: v.options.skip,
      arguments: v.options.args
    }
  }) : [];
}
