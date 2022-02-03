export const enum SomeEnum {
  A,
  B,
  C = 'hello',
  D = 1000,
  E,
}

export const enum ComputedEnum {
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

export enum RegularEnum {
  A,
  B,
}
