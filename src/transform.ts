import ts from 'typescript';
import { evaluate, getExportedNamesOfSource, hasModifier } from './utils';

export default function(program: ts.Program, pluginOptions?: unknown) {
  return (ctx: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      return ts.visitEachChild(sourceFile, visitor, ctx);

      function visitor(node: ts.Node): ts.Node {
        if (!ts.isEnumDeclaration(node)) {
          return ts.visitEachChild(node, visitor, ctx);
        }

        if (!hasModifier(node, ts.SyntaxKind.ConstKeyword)) {
          return node;
        }

        if (!hasModifier(node, ts.SyntaxKind.ExportKeyword)) {
          if (!getExportedNamesOfSource(program, sourceFile).includes(node.name.text)) {
            return node;
          }
        }

        if (sourceFile.isDeclarationFile) {
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
      node.modifiers,
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
