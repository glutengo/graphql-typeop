import { getScalarType, isFunction, Newable } from "../util/class.util";
import "reflect-metadata";
import * as GraphQL from 'graphql';
import { AstFieldOptions, AstVariableOptions, createQuery } from "../util/ast.util";

const metadataKey = Symbol('fields');

/**
 * Metadata stored for a field
 */
type FieldMetadata<T> = {
  type: Newable<any>,
  options: FieldOptions<T>
}

/**
 * Available options for field definition
 */
export type FieldOptions<T> = {
  /**
   * Whether the field is nullable
   */
  nullable?: boolean,
  /**
   * Field alias. Should be used to map a field which is not part of the GraphQL schema to a field which is part of the schema
   */
  aliasFor?: keyof T & string
}

/**
 * Metadata stored for a class
 */
type ClassMetadata<T> = (Map<string, FieldMetadata<T>>);

/**
 * Field decorator for fields in GraphQL type definitions
 *
 * @param typeOrOptions the type or options to use for the field.
 * If a function which represents a class is passed, this function is used as the type of the field.
 * If an object is passed, this is interpreted as the options for the field and {@param options} is ignored as a consequence
 * @param options the options to use for the field. Ignored when {@param typeOrOptions} is of type object
 * @returns the field decorator
 */
export function Field<T>(typeOrOptions?: Newable<any> | FieldOptions<T>, options?: FieldOptions<T>): PropertyDecorator {
  return(target, key) => {
    // first parameter can either be the type or the options
    let t: Newable<any>;
    if (typeof typeOrOptions === 'function') {
      t = typeOrOptions;
    } else if (typeof typeOrOptions === 'object') {
      options = typeOrOptions;
    }
    // if no type is passed, use TypeScript metadata. Note: this does not work for
    if (!t) {
      t =  Reflect.getMetadata('design:type', target, key);
    }
    options = {...options};
    if (t) {
      const fields = (Reflect.getMetadata(metadataKey, target) as ClassMetadata<T>) ?? new Map<string, FieldMetadata<T>>();
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
export function getFieldsDocument<T, A>(title: string, t: Newable<T>, a?: Newable<A>): GraphQL.DocumentNode {
  return {
    kind: 'Document',
    definitions: [
      createQuery({
        selections: [{
          name: title,
          alias: 'result',
          selections: getFieldOptions(t),
          arguments: a ? getArguments(a) : undefined
        }],
        variables: a ? getVariableOptions(a) : undefined
      })
    ]
  }
}


function getFieldMetadata<T>(t: Newable<T>): ClassMetadata<T> {
  return Reflect.getMetadata(metadataKey, new t() ?? new Map<String, FieldMetadata<T>>());
}

function getArguments<A>(a: Newable<A>): string[] {
  const fields = getFieldMetadata(a);
  return fields ? Array.from(fields.keys()) : [];
}

function getVariableOptions<A>(a: Newable<A>): AstVariableOptions[] {
  const fields = getFieldMetadata(a);
  return fields ? Array.from(fields.keys()).map(k => {
    const v = fields.get(k);
    return {
      name: k,
      type: getScalarType(v.type, true),
      nullable: v.options.nullable
    }
  }) : [];
}

function getFieldOptions<T>(t: Newable<T>): AstFieldOptions[] {
  const fields = getFieldMetadata(t);
  return fields ? Array.from(fields.keys()).map(k => {
    const v = fields.get(k);
    return {
      name: v.options.aliasFor ?? k,
      alias: v.options.aliasFor ? k : undefined,
      selections: v?.type && isFunction(v.type) ? getFieldOptions(v.type) : undefined
    }
  }) : [];
}
