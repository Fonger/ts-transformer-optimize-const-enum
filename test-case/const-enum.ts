const enum SomeEnum {
  A,
  B,
  C = 'hello',
  D = 1000,
  E,
}

const enum ComputedEnum {
  A,
  B,
  C,
  D = -B * 2,
  E = D ** 2,
  F = +B | C | D,
  G = ~C + B * (1234 - 3),
  H = ((1000 >> 3) << 2) >>> 4,
  I = G % 1000 ^ 2,
  J = '1' + '2',
  K = B & 1000 + H / 2,
}
export { ComputedEnum as CEnum, SomeEnum };

export const enum DirectExportEnum {
  HI = 'HELLO',
  WD = 'WORLD',
}

const enum DefaultExportConstEnum {
  X,
}

export default DefaultExportConstEnum;

const Value = 0.5;

const enum NonExportConstEnum {
  A = 666,
  B = 888,
}

enum NonExportEnum {
  A,
  B,
}

export function SomeFunc(inlineSomeEnum: SomeEnum, inlineComputedEnum: ComputedEnum) {
  if (inlineSomeEnum === SomeEnum.A) return SomeEnum.D;
  if (inlineComputedEnum === ComputedEnum.D) return ComputedEnum.E;
  return Math.random() > Value ? NonExportConstEnum.A : NonExportEnum.B;
}
