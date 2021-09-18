import * as GraphQL from 'graphql';
import { AstFieldOptions, AstVariableOptions, createMutation, createQuery } from '../util/ast.util';
import { getScalarType, isFunction, Newable } from '../util/class.util';
import { getArgsMetadata, getArgsTypeMetadata, getFieldMetadata } from '../util/reflection.util';

/**
 * builds a GraphQL AST document containing a query operation with the selection set specified via the fields in the given class
 *
 * @param t the class which specifies the selection set
 * @param a the (optional) class representing the arguments of the query
 * @returns a GraphQL DocumentNode
 */
export function buildQuery<T, A>(t: Newable<T>, a?: Newable<A>): GraphQL.DocumentNode {
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

/**
 * builds a GraphQL AST document containing a mutation operation with the selection set specified via the fields in the given class
 *
 * @param t the class which specifies the selection set
 * @param a the (optional) class representing the arguments of the mutation
 * @returns a GraphQL DocumentNode
 */
export function buildMutation<T, A>(t: Newable<T>, a?: Newable<A>): GraphQL.DocumentNode {
  return {
    kind: 'Document',
    definitions: [
      createMutation({
        selections: getFieldOptions(t),
        variables: a ? getVariableOptions(a) : undefined
      })
    ]
  }
}

/**
 * builds a GraphQL AST document containing a subscription operation with the selection set specified via the fields in the given class
 *
 * @param t the class which specifies the selection set
 * @param a the (optional) class representing the arguments of the mutation
 * @returns a GraphQL DocumentNode
 */
export function buildSubscription<T, A>(t: Newable<T>, a?: Newable<A>): GraphQL.DocumentNode {
  return {
    kind: 'Document',
    definitions: [
      createMutation({
        selections: getFieldOptions(t),
        variables: a ? getVariableOptions(a) : undefined
      })
    ]
  }
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
      include: v.options.include,
      arguments: v.options.args
    }
  }) : [];
}

function getVariableOptions<A>(a: Newable<A>): AstVariableOptions[] {
  const args = getArgsMetadata(new a());
  return args ? Array.from(args.keys()).map(k => {
    const v = args.get(k);
    const argsType = getArgsTypeMetadata(v.type);
    return {
      name: k,
      type: argsType || getScalarType(v.type),
      nullable: v.options.nullable
    }
  }) : [];
}
