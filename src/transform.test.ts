import ts from 'typescript';
import transform from './transform';
describe('transform export const enum into object literal', () => {
  const output = compile('test-case/const-enum.ts');

  for (const [fileName, content] of Object.entries(output)) {
    it(fileName, () => {
      expect(content).toMatchSnapshot();
    });
  }
});

type Output = { [fileName: string]: string };
function compile(fileName: string): Output {
  const program = ts.createProgram({
    rootNames: [fileName],
    options: {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.ES2015,
      preserveConstEnums: true,
      declaration: true,
      sourceMap: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
  });

  const transformer = transform(program);
  const output: Output = {};

  program.emit(
    undefined,
    (fileName, data) => {
      output[fileName] = (output[fileName] || '') + data;
    },
    undefined,
    false,
    {
      before: [transformer],
      afterDeclarations: [transformer as any],
    },
  );

  return output;
}
