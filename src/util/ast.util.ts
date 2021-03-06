import {
  ArgumentNode,
  DirectiveNode,
  FieldNode,
  NameNode,
  OperationDefinitionNode,
  OperationTypeNode,
  ValueNode,
  VariableDefinitionNode,
  VariableNode
} from 'graphql';

export type ScalarValue = number | string | boolean;
export type VariableValue<T> = `$${keyof T & string}`;
export type ArgumentValue<T> = VariableValue<T> | number | boolean | `"${string}"`;
export type BooleanArgumentValue<T> = VariableValue<T> | boolean;

export interface AstFieldOptions {
  name: string;
  alias?: string;
  arguments?: {[key: string]: ArgumentValue<any>},
  selections?: AstFieldOptions[],
  skip?: BooleanArgumentValue<any>,
  include?: BooleanArgumentValue<any>
}

export interface AstOperationOptions {
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

export function createQuery(options: AstOperationOptions): OperationDefinitionNode {
  return createOperation('query', options);
}

export function createMutation(options: AstOperationOptions): OperationDefinitionNode {
  return createOperation('mutation', options);
}

export function createSubscription(options: AstOperationOptions): OperationDefinitionNode {
  return createOperation('subscription', options);
}

function createOperation(operation: OperationTypeNode, options: AstOperationOptions): OperationDefinitionNode {
  return {
    kind: 'OperationDefinition',
    operation,
    selectionSet: { kind: 'SelectionSet', selections: options.selections.map(s => createField(s)) },
    variableDefinitions: options.variables ? options.variables.map(v => createVariableDefinition(v)) : undefined
  }
}

export function createField(options: AstFieldOptions): FieldNode {
  const directives = [];
  if (options.skip) {
    directives.push(createDirective({name: 'skip', arguments: [{name: 'if', value: options.skip}]}));
  }
  if (options.include) {
    directives.push(createDirective({name: 'include', arguments: [{name: 'if', value: options.include}]}));
  }
  return {
    kind: 'Field',
    name: createName(options.name),
    alias: options.alias ? createName(options.alias) : undefined,
    arguments: options.arguments ? Object.keys(options.arguments).map(k => createArgument(k, options.arguments[k])) : [],
    selectionSet: options.selections? { kind: 'SelectionSet', selections: options.selections.map(s => createField(s))} : undefined,
    directives
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
