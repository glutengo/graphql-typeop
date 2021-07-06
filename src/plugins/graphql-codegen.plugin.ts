const { Project } = require('ts-morph');

export function addDecorators(tsConfigPath) {
  const tsConfigFilePath = 'test/tsconfig.json';
  const project = new Project({ tsConfigFilePath });
  const sourceFile = project.getSourceFile('test/graphql.ts');
  sourceFile.getClasses().forEach(c => {
    addDecoratorIfMissing(c, { name: 'ArgsType', args: [] });
  });
  addImportIfMissing(sourceFile, { moduleSpecifier: 'graphql-typeop/decorators', namedImport: 'ArgsType' });
  sourceFile.saveSync();
}

function addImportIfMissing(sourceFile, importDeclationOptions) {
  const { namedImport, moduleSpecifier } = importDeclationOptions;
  let existingImport = sourceFile.getImportDeclaration(dec => dec.getModuleSpecifierValue() === moduleSpecifier);
  if (!existingImport) {
    existingImport = sourceFile.addImportDeclaration({ moduleSpecifier: moduleSpecifier });
  }
  if (!existingImport.getNamedImports().find(i => i.getName() === namedImport)) {
    existingImport.addNamedImport({ name: namedImport });
    return true;
  }
}

function addDecoratorIfMissing(c, decoratorOptions) {
  const { name, args } = decoratorOptions;
  if (!c.getDecorators().find(d => d.getName() === name)) {
    c.addDecorator({ name, arguments: args });
  }
}

export function plugin(schema, documents, config) {
    const statements = [];
    const typesMap = schema.getTypeMap();
    Object.keys(typesMap)
      .map(typeName => typesMap[typeName].astNode)
      .filter(astNode => astNode && astNode.kind === 'InputObjectTypeDefinition')
      .forEach(astNode => {
        console.log(astNode.fields[0]);
        const fields = astNode.fields.map(f => `${f.name.value}: string;`).join('\n');
        statements.push(`
@ArgsType()
export class ${astNode.name.value}Impl implements ${astNode.name.value} {
  ${fields}
}`)
      });
    return statements.join('\n');
}
