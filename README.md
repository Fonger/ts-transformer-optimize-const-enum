# ts-transformer-optimize-const-enum

A typescript transpiler that transform exported const enum into object literal! This is just like the one from [@babel/preset-typescript or @babel/plugin-transform-typescript with optimizeConstEnums: true](https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums) but it works for typescript compiler.

This will transform exported const enum from

```ts
export const enum MyEnum {
  A,
  B,
  C
  D = 10,
  D = C * 200
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
}
```

while stripping const in declaration file, to make your code compatible with `--isolatedModules`

```ts
declare enum MyEnum { ... }
```

## Why?
WIP

# Usage

WIP

# Caveats

Currently, only immediate export const enum works. For example:
This will be fixed in later version.

```ts
// The following works
export const enum WorkingEnum {}

// The following doesn't work
const enum FailingEnum {}
export FailEnum;
```

