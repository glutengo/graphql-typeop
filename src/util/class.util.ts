export type Newable<T> = { new (...args: any[]): T; };

const PRIMITVES = [String, Number, Boolean];

export function isFunction(f: any): boolean {
  if (typeof f !== 'function') {
    return false;
  }
  return !PRIMITVES.includes(f);
}

export function getScalarType(f?: Function): string {
  switch (f) {
    case Number:
      return 'Int';
    case Boolean:
      return 'Boolean';
    default:
      return 'String';
  }
}
