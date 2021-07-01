import { TypeFlags, Node, Program } from 'typescript';
import * as ts from 'typescript';

const CLASS_DECORATOR = 'ObjectType';
const FIELD_DECORATOR = 'Field';

function hasClassWithObjectTypeDecorator(sourceFile: ts.SourceFile) {
  return !!sourceFile.statements.find(s => typescript.isClassDeclaration(s) && hasObjectTypeDecorator(s));
}

function hasObjectTypeDecorator(node) {
  return node.decorators &&
    node.decorators.find(d => d.expression && d.expression.expression && d.expression.expression.escapedText === CLASS_DECORATOR);
}

function getExistingFieldDecorator(node) {
  return node.decorators &&
    node.decorators.find(d => d.expression && d.expression.expression && d.expression.expression.escapedText === FIELD_DECORATOR);
}

function getTypeIdentifier(type) {
  if (type.flags === ts.TypeFlags.Number) {
    return Number.name;
  }
  if (type.flags === ts.TypeFlags.String) {
    return String.name;
  }
  return Number.name;
}

export class GraphQLTransformer {
  static create(program: Program, typescript) {
    const typeChecker = program.getTypeChecker();
    return function (context: ts.TransformationContext) {
      return (rootNode) => typescript.visitNode(rootNode, visit);

      function visit(node) {
        // return ts.visitEachChild(node, visit, context);
        /*if (ts.isSourceFile(node) && hasClassWithObjectTypeDecorator(node)) {
          // TODO: handle imports?
          const updated = ts.updateSourceFileNode(node, [
            // importStatement,
            ...node.statements
          ]);
          // return ts.visitEachChild(updated, visit, context);
        }*/
        if (typescript.isPropertyDeclaration(node) && typescript.isClassDeclaration(node.parent) && hasObjectTypeDecorator(node.parent)) {
          const args = [];
          let typeArg = undefined;
          let optionsArg = typescript.factory.createObjectLiteralExpression();
          if (node.type) {
            const type = typeChecker.getTypeAtLocation(node.type);
            const symbol = type.getSymbol();
            // get type
            if (symbol && symbol.getName() === 'Array') {
              // @ts-ignore
              typeArg =  typescript.factory.createIdentifier(getTypeIdentifier(type.typeArguments[0]));
            }
          }
          // add options
          if (node.questionToken) {
            // @ts-ignore
            optionsArg = typescript.factory.updateObjectLiteralExpression(optionsArg, [typescript.factory.createPropertyAssignment('nullable', typescript.factory.createTrue())]);
          }
          // @ts-ignore
          const existingDecorator = getExistingFieldDecorator(node);
          if (existingDecorator) {
            const existingArgs = existingDecorator.expression.arguments;
            const existingOptionsIndex = existingArgs.findIndex(a => typescript.isObjectLiteralExpression(a));
            if (existingOptionsIndex > -1) {
              const existingOptions = existingArgs[existingOptionsIndex];
              existingDecorator.expression.arguments[existingOptionsIndex] = typescript.factory.updateObjectLiteralExpression(existingOptions, [ ...optionsArg.properties, ...existingOptions.properties]);
            } else {
              existingDecorator.expression.arguments = typescript.factory.createNodeArray([...existingArgs, optionsArg]);
            }
            return node;

          } else {
            if (typeArg) {
              args.push(typeArg);
            }
            if (optionsArg) {
              args.push(optionsArg);
            }
            const decorator = typescript.factory.createDecorator(
              typescript.factory.createCallExpression(
                typescript.factory.createIdentifier(FIELD_DECORATOR),
                [], // typeArguments
                args // ArgumentsArray
              ));
            return typescript.factory.updatePropertyDeclaration(
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
        // Visit each Child-Node recursively with the same visit function
        return typescript.visitEachChild(node, visit, context);
      }
    }
  }
}
