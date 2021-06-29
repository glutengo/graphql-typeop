export type Newable<T> = { new (...args: any[]): T; };

const PRIMITVES = [String, Number, Boolean];

export function isFunction(f: any): boolean {
  if (typeof f !== 'function') {
    return false;
  }
  return !PRIMITVES.includes(f);
}

export function getScalarType(f?: Function, nullable?: boolean): string {
  let t;
  switch (f) {
    case Number:
      t = 'Int';
      break;
    default:
      t = 'String';
  }
  return `${t}${nullable ? '' : '!'}`
}
