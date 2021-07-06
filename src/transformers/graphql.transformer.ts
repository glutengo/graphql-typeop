import * as ts from 'typescript';

enum DecoratorType {
  ARG = 'Arg',
  FIELD = 'Field',
  OBJECT_TYPE = 'ObjectType',
  ARGS_TYPE = 'ArgsType'
}

const MODULE_NAME = 'graphql-typeop';

function hasClassWithObjectTypeDecorator(sourceFile: ts.SourceFile) {
  return !!sourceFile.statements.find(s => ts.isClassDeclaration(s) && !!getExistingDecorator(s, DecoratorType.OBJECT_TYPE));
}

function getExistingDecorator(node, decoratorType: DecoratorType) {
  return node.decorators &&
    node.decorators.find(d => d.expression && d.expression.expression && d.expression.expression.escapedText === decoratorType)
}

function getTypeIdentifier(type: ts.Type, typeChecker: ts.TypeChecker) {
  if (type.flags === ts.TypeFlags.Number) {
    return Number.name;
  }
  if (type.flags === ts.TypeFlags.String) {
    return String.name;
  }
  return typeChecker.typeToString(type);
}

export default class GraphQLTransformer {
  static create(program: ts.Program, importPrefix = '') {
    const typeChecker = program.getTypeChecker();
    return function (context: ts.TransformationContext) {
      return (rootNode) => ts.visitNode(rootNode, visit);

      function visit(node) {
        if (ts.isImportDeclaration(node)) {
          return addImports(node);
        }

        if (ts.isPropertyDeclaration(node) && ts.isClassDeclaration(node.parent)) {
          if (!!getExistingDecorator(node.parent, DecoratorType.OBJECT_TYPE)) {
            return addDecorator(node, DecoratorType.FIELD);
          }
          if (!!getExistingDecorator(node.parent, DecoratorType.ARGS_TYPE)) {
            return addDecorator(node, DecoratorType.ARG);
          }
        }
        // Visit each Child-Node recursively with the same visit function
        return ts.visitEachChild(node, visit, context);
      }

      function addDecorator(node, decoratorType: DecoratorType) {
        const args = [];
        let typeArg = getTypeArg(node);
        let optionsArg = context.factory.createObjectLiteralExpression();
        // add implicit options
        optionsArg = addImplicitOptions(node, decoratorType, optionsArg);
        const existingDecorator = getExistingDecorator(node, decoratorType);
        if (existingDecorator) {
          optionsArg = addImplicitOptionsToExistingDecorator(existingDecorator, decoratorType, optionsArg);
          const existingArgs = existingDecorator.expression.arguments;
          const existingOptionsIndex = existingArgs.findIndex(a => ts.isObjectLiteralExpression(a));
          if (existingOptionsIndex > -1) {
            const existingOptions = existingArgs[existingOptionsIndex];
            optionsArg = context.factory.updateObjectLiteralExpression(existingOptions, [...optionsArg.properties, ...existingOptions.properties])
          }
          if (existingOptionsIndex === 0) {
            // => type is not given, use constructed type
            args.push(typeArg);
          }
          args.push(optionsArg);
          existingDecorator.expression.arguments = context.factory.createNodeArray(args);
          return node;
        } else {
          if (typeArg) {
            args.push(typeArg);
          }
          if (optionsArg) {
            args.push(optionsArg);
          }
          const decorator = context.factory.createDecorator(
            context.factory.createCallExpression(
              context.factory.createIdentifier(`${importPrefix}${decoratorType}`),
              [], // typeArguments
              args // ArgumentsArray
            ));
          return context.factory.updatePropertyDeclaration(
            node,
            [
              decorator
            ],
            node.modifiers,
            node.name,
            node.questionToken || node.exclamationToken,
            node.type,
            node.initializer
          );
        }
      }

      function addImplicitOptions(node, decoratorType: DecoratorType, options: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression {
        switch (decoratorType) {
          case DecoratorType.ARG:
            // if question token is present, make argument optional
            if (node.questionToken) {
              return context.factory.updateObjectLiteralExpression(
                options,
                [
                  ...options.properties,
                  context.factory.createPropertyAssignment('nullable', context.factory.createTrue())
                ]);
            }
            return options;
          default:
            return options;
        }
      }

      function addImplicitOptionsToExistingDecorator(decorator, decoratorType: DecoratorType, options: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression {
        switch (decoratorType) {
          case DecoratorType.FIELD:
            const typeArgs = decorator.expression.typeArguments;
            const fieldArgsType = typeArgs[1];
            // assume that fieldArgs and queryVars are the same if only one is given
            const queryVarsType = typeArgs[2] || fieldArgsType;
            // look for each fieldArg in queryVars and map them if a match is found
            if (fieldArgsType) {
              const fieldArgs = typeChecker.getPropertiesOfType(typeChecker.getTypeAtLocation(fieldArgsType));
              const queryVars = typeChecker.getPropertiesOfType(typeChecker.getTypeAtLocation(queryVarsType));
              const args = fieldArgs.reduce((res, arg) => {
                const correspondingQueryVar = queryVars.find(v => v.escapedName === arg.escapedName);
                if (correspondingQueryVar) {
                  res.push(context.factory.createPropertyAssignment(arg.escapedName as string, context.factory.createStringLiteral(`$${arg.escapedName}`)));
                }
                return res;
              }, []);
              options = context.factory.updateObjectLiteralExpression(
                options,
                [
                  ...(options.properties || []),
                  context.factory.createPropertyAssignment('args', context.factory.createObjectLiteralExpression(args))
                ]);
            }
            return options;
          default:
            return options;
        }
      }

      function addImports(node) {
        const moduleSpecifierText = ((node as ts.ImportDeclaration).moduleSpecifier as ts.Identifier).text;
        if (moduleSpecifierText.startsWith(MODULE_NAME)) {
          const oldNamedBindings = (node.importClause.namedBindings as ts.NamedImports).elements;
          const newNamedBindings = [DecoratorType.FIELD, DecoratorType.ARG].reduce((bindings, decoratorType) => {
            if (!oldNamedBindings.find((b: ts.ImportSpecifier) => b.name.escapedText === decoratorType)) {
              bindings.push(context.factory.createImportSpecifier(undefined, context.factory.createIdentifier(decoratorType)));
            }
            return bindings;
          }, [])
          const updatedNamedbindings = context.factory.updateNamedImports(node.importClause.namedBindings as ts.NamedImports, [...oldNamedBindings, ...newNamedBindings]);
          const updatedImportClause = context.factory.updateImportClause(node.importClause, node.importClause.isTypeOnly, node.importClause.name, updatedNamedbindings);
          return context.factory.updateImportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            updatedImportClause,
            node.moduleSpecifier
          );
        }
        return node;
      }

      function getTypeArg(node) {
        if (node.type) {
          const type = typeChecker.getTypeAtLocation(node.type);
          const symbol = type.getSymbol();
          if (symbol && symbol.getName() === 'Array') {
            const arrayType = (type as any).typeArguments[0];
            return context.factory.createIdentifier(getTypeIdentifier(arrayType, typeChecker));
          }
        }
      }
    }
  }
}
