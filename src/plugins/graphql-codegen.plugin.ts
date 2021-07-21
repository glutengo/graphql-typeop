const DEFAULT_SCALARS = [ 'String', 'Boolean', 'Int', 'Float', 'DateTime' ]

export function plugin(schema) {
  const typesMap = schema.getTypeMap();
  const statements = Object.keys(typesMap).reduce((res, key) => {
    const astNode = typesMap[key].astNode;
    if (astNode && astNode.kind === 'InputObjectTypeDefinition') {
      const name = astNode.name.value;
      const fields = astNode.fields.map(f => getFieldDefinition(f)).join('\n  ');
      res.push(`
@ArgsType('${name}')
export class ${name}Impl implements ${name} {
  ${fields}
}`
      );
    }
    return res;
  }, []);
  const imports = [ `import { ArgsType } from 'graphql-typeop/decorators';` ];

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
  }
}

function getTypeDefinition(type) {
  return DEFAULT_SCALARS.indexOf(type) > -1 ? `Scalars['${type}']` : type;
}
