# ts-transformer-optimize-const-enum

[![](https://img.shields.io/npm/v/ts-transformer-optimize-const-enum.svg)](https://www.npmjs.com/package/ts-transformer-optimize-const-enum) ![CI Status](https://github.com/Fonger/ts-transformer-optimize-const-enum/actions/workflows/test.yml/badge.svg) [![codecov](https://codecov.io/gh/Fonger/ts-transformer-optimize-const-enum/branch/main/graph/badge.svg?token=CHDVP7EMNA)](https://codecov.io/gh/Fonger/ts-transformer-optimize-const-enum)

A typescript transformer that convert exported const enum into object literal.

This is just like the one from [@babel/preset-typescript with optimizeConstEnums: true](https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums) but it works for typescript compiler.

This will transform exported const enum from

```ts
export const enum MyEnum {
  A,
  B,
  C,
  D = 10,
  E = C * 200,
}
```

into object literal like this

```ts
export const MyEnum {
  A: 0,
  B: 1,
  C: 2,
  D: 10,
  E: 400
} as const
```

and it also strips `const` in declaration file, to make your code compatible with [`--isolatedModules`](https://www.typescriptlang.org/tsconfig#isolatedModules)

```ts
// my-enum.d.ts
declare enum MyEnum { A: 0, ... }
```

## Why?

Const enum can only works in the same file. It works by inlining the exact value into code.
With [isolateModules](https://www.typescriptlang.org/tsconfig#isolatedModules), you can't use the exported const enum. The solution is to enable [preserveConstEnums](https://www.typescriptlang.org/tsconfig#preserveConstEnums) option to convert const enum to regular enum.

However, the regular enum compiles to

```js
export var MyEnum;
(function(MyEnum) {
  MyEnum[MyEnum['A'] = 0] = 'A';
  MyEnum[MyEnum['B'] = 1] = 'B';
  MyEnum[MyEnum['C'] = 2] = 'C';
  MyEnum[MyEnum['D'] = 10] = 'D';
  MyEnum[MyEnum['E'] = 400] = 'E';
})(MyEnum || (MyEnum = {}));
```

Not only can't you take advantage of enum inlining, but it also wastes a lot of bytes. That's the reason why this transform is made.

# Installation

```sh
npm install ts-transformer-optimize-const-enum --save-dev
```

# Usage

If you use vanilla TypeScript compiler, you can use this with [ttypescript](https://github.com/cevek/ttypescript) and compile with `ttsc` instead of `tsc`

## ttypescript

```js
// tsconfig.json
{
  "compilerOptions": {
    // ...
    "plugins": [
      { "transform": "ts-transformer-optimize-const-enum" },
      { "transform": "ts-transformer-optimize-const-enum", "afterDeclarations": true },
    ]
  },
  // ...
}
```

The afterDeclarations part is to strip out const keyword from declaration file.

## webpack (with ts-loader or awesome-typescript-loader)

```js
// webpack.config.js
const optimizeConstEnum = require('ts-transformer-optimize-const-enum').default;

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader', // or 'awesome-typescript-loader'
        options: {
          getCustomTransformers: program => ({
            before: [
              optimizeConstEnum(program),
            ],
            afterDeclarations: [
              optimizeConstEnum(program),
            ],
          }),
        },
      },
    ],
  },
};
```

## Rollup (with rollup-plugin-typescript2)

```js
// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import optimizeConstEnum from 'ts-transformer-optimize-const-enum';

export default {
  // ...
  plugins: [
    typescript({
      transformers: [service => ({
        before: [
          optimizeConstEnum(service.getProgram()),
        ],
        afterDeclarations: [
          optimizeConstEnum(service.getProgram()),
        ],
      })],
    }),
  ],
};
```

# Caveats

Currently, only immediate export const enum works. For example:

```ts
// The following works
export const enum WorkingEnum {}

// The following doesn't work
const enum FailingEnum {}
export FailEnum;
```

This may be fixed in future release.
