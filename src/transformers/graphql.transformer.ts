import * as ts from 'typescript';

enum DecoratorType {
  ARG = 'Arg',
  FIELD = 'Field',
  OBJECT_TYPE = 'ObjectType',
  ARGS_TYPE = 'ArgsType'
}

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
  if (type.isClass()) {
    return typeChecker.typeToString(type);
  }
  return Number.name;
}

export class GraphQLTransformer {
  static create(program: ts.Program, importPrefix = '') {
    const typeChecker = program.getTypeChecker();
    return function (context: ts.TransformationContext) {
      return (rootNode) => ts.visitNode(rootNode, visit);

      function visit(node) {
        // TODO: handle imports
        // return ts.visitEachChild(node, visit, context);
        /*if (ts.isSourceFile(node) && hasClassWithObjectTypeDecorator(node)) {
          // TODO: handle imports?
          const updated = ts.updateSourceFileNode(node, [
            // importStatement,
            ...node.statements
          ]);
          // return ts.visitEachChild(updated, visit, context);
        }*/

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
        // add options
        if (node.questionToken) {
          optionsArg = context.factory.updateObjectLiteralExpression(optionsArg, [context.factory.createPropertyAssignment('nullable', context.factory.createTrue())]);
        }
        const existingDecorator = getExistingDecorator(node, decoratorType);
        if (existingDecorator) {
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

      function getTypeArg(node) {
        if (node.type) {
          const type = typeChecker.getTypeAtLocation(node.type);
          const symbol = type.getSymbol();
          // get type
          if (symbol && symbol.getName() === 'Array') {
            // @ts-ignore
            const arrayType = type.typeArguments[0];
            return context.factory.createIdentifier(getTypeIdentifier(arrayType, typeChecker));
          }
        }
      }
    }
  }
}
