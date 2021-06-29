import { getScalarType, isFunction, Newable } from "../util/class.util";
import "reflect-metadata";

const metadataKey = Symbol('fields');

type FieldMetadataEntry<T> = FieldMetadataEntryData<T> | undefined;

type FieldMetadataEntryData<T> = {
  type: Newable<any>,
  options: FieldOptions<T>
}

type FieldOptions<T> = {
  nullable?: boolean,
  aliasFor?: keyof T
}

type FieldMetadata<T> = (Map<string, FieldMetadataEntry<T>>);

export function Field<T>(typeOrOptions?: Newable<any>|FieldOptions<T>, options?: FieldOptions<T>): PropertyDecorator {
  return(target: T, key) => {
    let t;
    if (typeof typeOrOptions === 'function') {
      t = typeOrOptions;
    } else if (typeof typeOrOptions === 'object') {
      options = typeOrOptions;
    }
    if (!t) {
      t =  Reflect.getMetadata('design:type', target, key);
    }
    options = {...options};
    if (t) {
      const fields = (Reflect.getMetadata(metadataKey, target) as FieldMetadata<T>) ?? new Map<string, FieldMetadataEntry<T>>();
      fields.set(key as string, { type: t, options});
      Reflect.defineMetadata(metadataKey, fields, target);
    }
  }
}

function getFieldMetadata<T>(t: Newable<T>): FieldMetadata<T> {
  return Reflect.getMetadata(metadataKey, new t() ?? new Map<String, FieldMetadataEntry<T>>());
}

export function getFieldsGQL<T, A>(title: string, t: Newable<T>, a?: Newable<A>): string {
  const fieldsString = getFieldsString(title, t, a);
  let query = `query`;
  if (a) {
    query = `${query}(${getQueryArgsString(a)})`
  }
  const q = `${query}{ result: ${fieldsString} }`;
  console.warn(q);
  return q;
}

function getFieldsString<T, A>(title: string, t: Newable<T>, a?: Newable<A>): string {
  const fields = getFieldMetadata(t);
  const fieldsString = Array.from(fields.keys()).map(k => {
    const v = fields.get(k);
    const fieldTitle = v.options.aliasFor ? `${k}:${v.options.aliasFor}` : k;
    if (v?.type && isFunction(v.type)) {
      return getFieldsString(fieldTitle, v.type);
    } else {
      return fieldTitle;
    }
  }).join(',')
  const fieldArgsString = a ? getFieldArgsString(a) : '';
  return `${title}${fieldArgsString} { ${fieldsString} }`
}

function getFieldArgsString<A> (a: Newable<A>): string {
  const fields = getFieldMetadata(a);
  if (fields.size > 0) {
    const fieldsString = Array.from(fields.keys()).map(k => `${k}: $${k}`).join(',');
    return ` (${fieldsString})`;
  } else {
    return '';
  }
}

function getQueryArgsString<A> (a: Newable<A>): string {
  const fields = getFieldMetadata(a);
  return Array.from(fields.keys()).map(k => {
    const v = fields.get(k);
    return `$${k}: ${getScalarType(v?.type, v?.options.nullable)}`;
  }).join(',');
}
