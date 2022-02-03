import ts from 'typescript';

export function evaluate(
  expr: ts.Expression,
  known: Map<string, number | string>,
): string | number | undefined {
  if (ts.isPrefixUnaryExpression(expr)) {
    const value = evaluate(expr.operand, known);
    if (typeof value === 'number') {
      switch ((expr as ts.PrefixUnaryExpression).operator) {
        case ts.SyntaxKind.PlusToken:
          return value;
        case ts.SyntaxKind.MinusToken:
          return -value;
        case ts.SyntaxKind.TildeToken:
          return ~value;
      }
    }
  } else if (ts.isBinaryExpression(expr)) {
    const left = evaluate(expr.left, known);
    const right = evaluate(expr.right, known);
    if (typeof left === 'number' && typeof right === 'number') {
      switch (expr.operatorToken.kind) {
        case ts.SyntaxKind.BarToken:
          return left | right;
        case ts.SyntaxKind.AmpersandToken:
          return left & right;
        case ts.SyntaxKind.GreaterThanGreaterThanToken:
          return left >> right;
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
          return left >>> right;
        case ts.SyntaxKind.LessThanLessThanToken:
          return left << right;
        case ts.SyntaxKind.CaretToken:
          return left ^ right;
        case ts.SyntaxKind.AsteriskToken:
          return left * right;
        case ts.SyntaxKind.SlashToken:
          return left / right;
        case ts.SyntaxKind.PlusToken:
          return left + right;
        case ts.SyntaxKind.MinusToken:
          return left - right;
        case ts.SyntaxKind.PercentToken:
          return left % right;
        case ts.SyntaxKind.AsteriskAsteriskToken:
          return left ** right;
      }
    } else if (
      typeof left === 'string'
      && typeof right === 'string'
      && expr.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      return left + right;
    }
  } else if (ts.isStringLiteralLike(expr)) {
    return expr.text;
  } else if (ts.isNumericLiteral(expr)) {
    return +expr.text;
  } else if (ts.isParenthesizedExpression(expr)) {
    return evaluate(expr.expression, known);
  } else if (ts.isIdentifier(expr)) {
    if (!known.has(expr.text)) {
      throw new Error('unsupported enum. must reference self value');
    }
    return known.get(expr.text);
  }

  return undefined;
}

export function hasModifier(node: ts.Node, modifier: ts.SyntaxKind): boolean {
  return (
    node.modifiers
    && node.modifiers.some((mod: ts.Modifier) => mod.kind === modifier)
  );
}