import { ArgumentNode, FieldNode, NameNode, OperationDefinitionNode, ValueNode, VariableDefinitionNode, VariableNode } from 'graphql';

export interface AstFieldOptions {
  name: string;
  alias?: string;
  arguments?: string[],
  selections?: AstFieldOptions[]
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

export function createQuery(options: AstQueryOptions): OperationDefinitionNode {
  return {
    kind: 'OperationDefinition',
    operation: 'query',
    selectionSet: { kind: 'SelectionSet', selections: options.selections.map(s => createField(s)) },
    variableDefinitions: options.variables ? options.variables.map(v => createVariableDefinition(v)) : undefined
  }
}

export function createField(options: AstFieldOptions): FieldNode {
  return {
    kind: 'Field',
    name: createName(options.name),
    alias: options.alias ? createName(options.alias) : undefined,
    arguments: options.arguments ? options.arguments.map(a => createArgument(a)) : [],
    selectionSet: options.selections? { kind: 'SelectionSet', selections: options.selections.map(s => createField(s))} : undefined
  };
}

export function createName(name: string): NameNode {
  return {
    kind: 'Name',
    value: name
  }
}

export function createArgument(name: string): ArgumentNode {
  return {
    kind: 'Argument',
    name: createName(name),
    value: {
      kind: 'Variable',
      name: createName(name)
    }
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
