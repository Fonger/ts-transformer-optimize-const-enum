import ts from 'typescript';
import { evaluate, getModifier } from './utils';

export default function(program: ts.Program, pluginOptions?: unknown) {
  return (ctx: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      const ambient = sourceFile.isDeclarationFile;

      return ts.visitEachChild(sourceFile, visitor, ctx);

      function visitor(node: ts.Node): ts.Node {
        if (!ts.isEnumDeclaration(node)) {
          return ts.visitEachChild(node, visitor, ctx);
        }
        const exportModifier = getModifier(node, ts.SyntaxKind.ExportKeyword);
        if (!exportModifier) return node;
        const constModifier = getModifier(node, ts.SyntaxKind.ConstKeyword);
        if (!constModifier) return node;

        if (ambient) {
          return ts.visitEachChild(node, stripConstKeyword, ctx);
        }

        return transformEnum(node, [exportModifier, constModifier]);
      }
    };
  };

  function stripConstKeyword(node: ts.Node) {
    return node.kind === ts.SyntaxKind.ConstKeyword ? undefined : node;
  }

  function transformEnum(node: ts.EnumDeclaration, modifiers: ts.Modifier[]) {
    const members = node.members;
    const known = new Map<string, number | string>();
    const properties: ts.PropertyAssignment[] = [];
    let lastValue: string | number = -1;

    for (const member of members) {
      if (!ts.isIdentifier(member.name)) {
        throw new Error('The name of enum member must be an identifier');
      }
      const name = member.name.getText();
      let value: string | number;
      let valueExpr: ts.Expression;

      if (member.initializer) {
        value = evaluate(member.initializer, known);

        if (typeof value === 'number') {
          valueExpr = ts.factory.createNumericLiteral(value);
          lastValue = value;
        } else if (typeof value === 'string') {
          valueExpr = ts.factory.createStringLiteral(value);
          lastValue = value;
        } else throw new Error('Unsupported member value');
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
        valueExpr = ts.factory.createNumericLiteral(value);
      }
      const assignment = ts.factory.createPropertyAssignment(name, valueExpr);
      ts.setSourceMapRange(assignment, ts.getSourceMapRange(member));
      properties.push(assignment);
      known.set(name, value);
    }

    const result = ts.factory.createVariableStatement(
      modifiers,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            node.name,
            undefined,
            undefined,
            ts.factory.createAsExpression(
              ts.factory.createObjectLiteralExpression(properties, true),
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

    ts.setSourceMapRange(result, ts.getSourceMapRange(node));
    return result;
  }
}
