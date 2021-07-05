import { Field, ObjectType, getFieldsDocument, ArgsType } from '../dist/decorators';
import { print } from 'graphql/language/printer'

interface BaseObjectType {
  f?: string;
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

type Query = {
  getMyObjectType: BaseObjectType
}

@ObjectType()
class MyQuery {
  @Field<Query, MyObjectArgs, MyArgsType>({ aliasFor: 'getMyObjectType', args: {a: '$a'} })
  result: MyObjectType;
}

@ArgsType()
class MyArgsType {
  a?: string;
  skipA?: boolean;
}

@ArgsType()
class MyObjectArgs {
  a?: string;
}

const doc = getFieldsDocument(MyQuery, MyArgsType);
console.log(print(doc));
