import { ArgumentNode, DirectiveNode, FieldNode, NameNode, OperationDefinitionNode, ValueNode, VariableDefinitionNode, VariableNode } from 'graphql';

export type ScalarValue = number | string | boolean;
export type VariableValue<T> = `$${keyof T & string}`;
export type ArgumentValue<T> = VariableValue<T> | number | boolean | `"${string}"`;

export interface AstFieldOptions {
  name: string;
  alias?: string;
  arguments?: {[key: string]: ArgumentValue<any>},
  selections?: AstFieldOptions[],
  skip?: ArgumentValue<any>
}

export interface AstQueryOptions {
  name?: string;
  selections: AstFieldOptions[],
  variables?: AstVariableOptions[]
}

export interface AstVariableOptions {
  name: string;
  type: string;
  nullable?: boolean;
  // TODO: implement this
  list?: boolean;
}

export interface AstDirectiveOptions {
  name: string;
  arguments?: {name: string, value: ArgumentValue<any>}[];
}

export function createQuery(options: AstQueryOptions): OperationDefinitionNode {
  return {
    kind: 'OperationDefinition',
    operation: 'query',
    selectionSet: { kind: 'SelectionSet', selections: options.selections.map(s => createField(s)) },
    variableDefinitions: options.variables ? options.variables.map(v => createVariableDefinition(v)) : undefined
  }
}

export function createMutation(options: AstQueryOptions): OperationDefinitionNode {
  return {
    kind: 'OperationDefinition',
    operation: 'mutation',
    selectionSet: { kind: 'SelectionSet', selections: options.selections.map(s => createField(s)) },
    variableDefinitions: options.variables ? options.variables.map(v => createVariableDefinition(v)) : undefined
  }
}

export function createField(options: AstFieldOptions): FieldNode {
  return {
    kind: 'Field',
    name: createName(options.name),
    alias: options.alias ? createName(options.alias) : undefined,
    arguments: options.arguments ? Object.keys(options.arguments).map(k => createArgument(k, options.arguments[k])) : [],
    selectionSet: options.selections? { kind: 'SelectionSet', selections: options.selections.map(s => createField(s))} : undefined,
    directives: options.skip ? [createDirective({name: 'skip', arguments: [{name: 'if', value: options.skip}]})] : undefined
  };
}

export function createDirective(options: AstDirectiveOptions): DirectiveNode {
  return {
    kind: 'Directive',
    name: createName(options.name),
    arguments: options.arguments.map(a => createArgument(a.name, a.value))
  }
}

export function createName(name: string): NameNode {
  return {
    kind: 'Name',
    value: name
  }
}

export function createArgument(name: string, value: ArgumentValue<any>): ArgumentNode {
  return {
    kind: 'Argument',
    name: createName(name),
    value: createValueNode(value)
  }
}

export function createValueNode(value: ArgumentValue<any>): ValueNode {
  switch (typeof value) {
    case 'string':
      if (value.startsWith('$')) {
        return {
          kind: 'Variable',
          name: createName(value.substring(1))
        }
      } else {
        const match = value.match(/"(.*)"/);
        if (match) {
          return {
            kind: 'StringValue',
            value: match[1]
          }
        }
      }
    case 'number':
      return {
        kind: 'IntValue',
        value: `${value}`
      };
    case 'boolean':
      return {
        kind: 'BooleanValue',
        value
      };
  }
}

function createVariableDefinition(options: AstVariableOptions): VariableDefinitionNode {
  return {
    kind: 'VariableDefinition',
    variable: createVariable(options.name),
    type: options.nullable
      ? { kind: 'NamedType', name: createName(options.type)}
      : { kind: 'NonNullType', type: { kind: 'NamedType', name: createName(options.type)}
    }
  }
}

function createVariable(name: string): VariableNode {
  return {
    kind: 'Variable',
    name: createName(name)
  }
}
