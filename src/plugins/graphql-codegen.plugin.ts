const DEFAULT_SCALARS = [ 'String', 'Boolean', 'Int', 'Float', 'DateTime' ]

/**
 * GraphQL code generator plugin. Adds implementations for all InputObjectTypeDefinitions provided by the schema
 * @param schema
 */
export function plugin(schema) {
  const typesMap = schema.getTypeMap();
  let statements = Object.keys(typesMap).reduce((res, key) => {
    const astNode = typesMap[key].astNode;
    if (astNode && astNode.kind === 'InputObjectTypeDefinition') {
      const name = astNode.name.value;
      const fields = astNode.fields.map(f => getFieldDefinition(f)).join('\n  ');
      const statement = `
@ArgsType('${name}')
export class ${name}Impl implements ${name} {
  ${fields}
}`
      res.push({
        astNode,
        statement,
      });
    }
    return res;
  }, []);
  const imports = [ `import { ArgsType } from 'graphql-typeop/decorators';` ];

  statements = statements.sort((a, b) => {
    const numberOfUsedA = statements.filter(s => !!s.astNode.fields.find(f => getFieldType(f) === a.astNode.name.value)).length;
    const numberOfUsedB = statements.filter(s => !!s.astNode.fields.find(f => getFieldType(f) === b.astNode.name.value)).length;
    return numberOfUsedB - numberOfUsedA;
  });

  return {
    content: '',
    prepend: imports,
    append: statements.map(s => s.statement)
  }
}

function getFieldDefinition(field) {
  return getDefinition(field.name.value, field.type);
}

function getDefinition(name, type, nonNull = false, list = false) {
  if (type.kind === 'NamedType') {
    return name + (nonNull ? '!: ' : '?: Maybe<') + getTypeDefinition(type.name.value, list) + (nonNull ? ';' : '>;');
  } else if (type.kind === 'NonNullType') {
    return getDefinition(name, type.type, true, list);
  } else if (type.kind === 'ListType') {
    return getDefinition(name, type.type, nonNull, true);
  }
}

function getFieldType(astNode) {
  if (astNode.type.kind === 'NamedType') {
    return astNode.type.name.value;
  } else {
    return getFieldType(astNode.type);
  }
}

function getTypeDefinition(type, list) {
  return (DEFAULT_SCALARS.indexOf(type) > -1 ? `Scalars["${type}"]` : `${type}Impl`) + (list ? '[]' : '');
}
