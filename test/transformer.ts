import { Field, ObjectType, ArgsType } from '../dist/decorators';
import { buildMutation } from '../dist/builders';
import { print } from 'graphql/language/printer'
import { normalizeDoc } from './util';
import * as chalk from 'chalk';

interface BaseObjectType {
  f?: string;
  g?: ArrayType[];
  h?: string;
  i?: string;
}

@ObjectType()
class ArrayType {
  id: number;
  value: string;
}

@ObjectType()
class MyObjectType implements Partial<BaseObjectType> {
  f: string;
  @Field<BaseObjectType, any, MyArgsType>({ aliasFor: 'f', skip: '$skipA' })
  a: string;
  g: ArrayType[];
}

@ObjectType()
class DetailObjectType extends MyObjectType {
  i?: string;
}

type Query = {
  getMyObjectType: BaseObjectType
}

@ObjectType()
class MyQuery {
  @Field<Query, MyObjectArgs, MyArgsType>()
  result: MyObjectType;
}

type CompositeUser = {
  login: string;
}

@ArgsType()
class MyArgsType {
  a?: string;
  skipA?: boolean;
  user?: CompositeUser;
}

@ArgsType()
class Extension1 extends MyArgsType {
  b?: string;
}

@ArgsType()
class Extension2 extends MyArgsType {
  c?: string;
}

@ArgsType()
class MyObjectArgs {
  a?: string;
}

const doc = buildMutation(MyQuery, MyArgsType);
const expected = 'mutation ($a: String, $skipA: Boolean, $user: Object) { result(a: $a) { f a: f @skip(if: $skipA) g { id value } } }';

if (normalizeDoc(print(doc)) === normalizeDoc(expected)) {
  console.log(chalk.green("Transformer test successful"));
} else {
  console.warn("expected: ");
  console.log(chalk.green(normalizeDoc(expected)));
  console.warn("got: ");
  console.log(chalk.red(normalizeDoc(print(doc))));
  throw new Error("Transformer test failed");
}
