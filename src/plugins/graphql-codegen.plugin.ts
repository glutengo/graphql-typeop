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

function getTypeDefinition(type, list) {
  return (DEFAULT_SCALARS.indexOf(type) > -1 ? "Scalars['" + type + "']" : type) + (list ? '[]' : '');
}
