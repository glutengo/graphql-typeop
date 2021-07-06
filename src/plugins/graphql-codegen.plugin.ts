const DEFAULT_SCALARS = [ 'String', 'Boolean', 'Int', 'Float', 'DateTime' ]

export function plugin(schema, documents, config) {
  const statements = [];
  const typesMap = schema.getTypeMap();
  Object.keys(typesMap)
    .map(typeName => typesMap[typeName].astNode)
    .filter(astNode => astNode && astNode.kind === 'InputObjectTypeDefinition')
    .forEach(astNode => {
      const name = astNode.name.value;
      const fields = astNode.fields.map(f => getFieldDefinition(f)).join('\n');
      statements.push(`
@ArgsType('${name}')
export class ${name}Impl implements ${name} {
  ${fields}
}`)
    });

  const imports = [];
  imports.push(`import { ArgsType } from 'graphql-typeop/decorators';`);

  return {
    content: '',
    prepend: imports,
    append: statements
  }
}

function getFieldDefinition(field) {
  const nameDefinition = field.name.value;
  let type, typeDefinition;
  switch (field.type.kind) {
    case 'NamedType':
      type = field.type.name.value;
      typeDefinition = getTypeDefinition(type);
      return `${nameDefinition}?: Maybe<${typeDefinition}>;`;
    case 'NonNullType':
      type = field.type.type.name.value;
      typeDefinition = getTypeDefinition(type);
      return `${nameDefinition}!: ${typeDefinition};`;
      break;
  }
}

function getTypeDefinition(type) {
  return DEFAULT_SCALARS.indexOf(type) > -1 ? `Scalars['${type}']` : type;
}
