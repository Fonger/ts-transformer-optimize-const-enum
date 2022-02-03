import ts from 'typescript';
import { evaluate, hasModifier } from './utils';

export default function(program: ts.Program, pluginOptions?: unknown) {
  return (ctx: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      const ambient = sourceFile.isDeclarationFile;

      return ts.visitEachChild(sourceFile, visitor, ctx);

      function visitor(node: ts.Node): ts.Node {
        if (!ts.isEnumDeclaration(node)) {
          return ts.visitEachChild(node, visitor, ctx);
        }
        if (
          !hasModifier(node, ts.SyntaxKind.ExportKeyword)
          || !hasModifier(node, ts.SyntaxKind.ConstKeyword)
        ) {
          return node;
        }

        if (ambient) {
          return ts.visitEachChild(node, stripConstKeyword, ctx);
        }

        return transformEnum(node);
      }
    };
  };

  function stripConstKeyword(node: ts.Node) {
    return node.kind === ts.SyntaxKind.ConstKeyword ? undefined : node;
  }

  function transformEnum(node: ts.EnumDeclaration) {
    const members = node.members;
    const known = new Map<string, number | string>();
    const ast = [];
    let lastValue: string | number = -1;

    for (const member of members) {
      if (!ts.isIdentifier(member.name)) {
        throw new Error('The name of enum member must be an identifier');
      }
      const name = member.name.getText();
      let value: string | number;

      if (member.initializer) {
        value = evaluate(member.initializer, known);
        let valueExpr: ts.Expression;
        if (typeof value === 'number') {
          valueExpr = ts.factory.createNumericLiteral(value);
          lastValue = value;
        } else if (typeof value === 'string') {
          valueExpr = ts.factory.createStringLiteral(value);
          lastValue = value;
        } else throw new Error('Unsupported member value');

        ast.push(ts.factory.createPropertyAssignment(name, valueExpr));
      } else {
        if (typeof lastValue === 'string') {
          throw new Error('Invalid enum');
        }
        /**
         * last known value+1
         * enum MyEnum {
         *   A = 5,
         *   B, // implicit 6
         *   C, // implicit 7,
         *   D = 1000,
         *   E, // implicit 1001
         * }
         */
        value = ++lastValue;
        ast.push(
          ts.factory.createPropertyAssignment(
            name,
            ts.factory.createNumericLiteral(value),
          ),
        );
      }
      known.set(name, value);
    }

    return ts.factory.createVariableStatement(
      [
        ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
        ts.factory.createModifier(ts.SyntaxKind.ConstKeyword),
      ],
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            node.name,
            undefined,
            undefined,
            ts.factory.createAsExpression(
              ts.factory.createObjectLiteralExpression(ast, true),
              ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('const'),
                undefined,
              ),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }
}
